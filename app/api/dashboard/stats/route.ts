import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, isAdmin as checkAdmin } from "@/lib/auth-utils";

export async function GET(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const isAdmin = await checkAdmin();
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const targetUserId = searchParams.get("companyId"); // Only for admins
        const yearParam = searchParams.get("year");
        const monthParam = searchParams.get("month");
        const selectedHsCode = searchParams.get("hsCode");
        const selectedYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();
        const selectedMonth = monthParam ? parseInt(monthParam) : null;

        // Build filters
        const filters: any = {};

        // Ownership filter
        if (isAdmin && targetUserId) {
            filters.userId = targetUserId;
        } else if (!isAdmin) {
            filters.userId = userId;
        }

        // Date filter (Manual overwrite of year if provided)
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) filters.createdAt.gte = new Date(startDate);
            if (endDate) filters.createdAt.lte = new Date(endDate);
        } else if (yearParam) {
            // Optimization: Filter by year if possible
            const startOfYear = new Date(selectedYear, 0, 1);
            const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);
            filters.createdAt = { gte: startOfYear, lte: endOfYear };
        }

        // HS Code filter
        if (selectedHsCode) {
            filters.goods = { hsCode: selectedHsCode };
        }

        // Fetch Bill of Ladings with Containers and Goods info
        const bls = await prisma.billOfLading.findMany({
            where: filters,
            include: {
                containers: true,
                goods: true,
            }
        });

        // Calculations
        let countBL = 0;
        let count20 = 0;
        let count40 = 0;
        let totalTonnage = 0;
        const goodsMap: Record<string, number> = {};
        const destMap: Record<string, number> = {};

        // Initialize monthly stats (12 months)
        const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            tonnage: 0,
            teu: 0
        }));

        // Fetch natures (HS Code descriptions) for cleaner display
        const hsCodesData = await prisma.hSCode.findMany({
            where: isAdmin && targetUserId ? { userId: targetUserId } : (isAdmin ? {} : { userId }),
            select: { code: true, description: true }
        });
        const natureMap: Record<string, string> = {};
        hsCodesData.forEach(h => { natureMap[h.code] = h.description; });

        const isDateRange = !!(startDate || endDate);

        bls.forEach(bl => {
            const blDate = new Date(bl.createdAt);
            const blMonthIndex = blDate.getMonth(); 
            const blMonthNum = blMonthIndex + 1;
            const blYear = blDate.getFullYear();
            
            const isSelectedYear = selectedYear ? blYear === selectedYear : true;
            const isSelectedMonth = selectedMonth ? blMonthNum === selectedMonth : true;

            // Global stats condition: 
            // If date range provided, use all records (already filtered by Prisma)
            // Otherwise, respect year/month selection
            const isInContext = isDateRange || (isSelectedYear && isSelectedMonth);

            if (isInContext) {
                countBL += 1;
            }

            // Containers
            bl.containers.forEach(cn => {
                const type = cn.typeTc.toLowerCase();
                let teu = 0;
                if (type.includes("20")) {
                    teu = 1;
                    if (isInContext) count20 += 1;
                } else if (type.includes("40")) {
                    teu = 2;
                    if (isInContext) count40 += 1;
                }

                if (isInContext) {
                    totalTonnage += cn.grossWeight || 0;
                }

                // Monthly stats for chart
                // If it's a specific year view, fill the 12-month array
                if (!isDateRange && blYear === selectedYear) {
                    monthlyStats[blMonthIndex].tonnage += cn.grossWeight || 0;
                    monthlyStats[blMonthIndex].teu += teu;
                } 
                // If it's a date range, we just accumulate but chart might need logic 
                // (for now let's keep it simple: if date range, monthlyStats will only have data for those months)
                else if (isDateRange) {
                    monthlyStats[blMonthIndex].tonnage += cn.grossWeight || 0;
                    monthlyStats[blMonthIndex].teu += teu;
                }
            });

            // Goods & Destinations - relative to context
            if (isInContext) {
                const hs = bl.goods?.hsCode;
                const nature = hs ? natureMap[hs] : null;
                const goodsName = hs ? (nature ? `${hs} - ${nature}` : hs) : "Non spécifié";
                goodsMap[goodsName] = (goodsMap[goodsName] || 0) + 1;

                const dest = bl.portCityText || bl.portCountryText || "Inconnu";
                destMap[dest] = (destMap[dest] || 0) + 1;
            }
        });

        // Format goods for percentages
        const goodsList = Object.entries(goodsMap).map(([name, count]) => ({
            name,
            percentage: countBL > 0 ? (count / countBL) * 100 : 0
        })).sort((a, b) => b.percentage - a.percentage);

        // Format destinations
        const destList = Object.entries(destMap).map(([name, count]) => ({
            name,
            count
        })).sort((a, b) => b.count - a.count);

        // Fetch available HS codes/goods for filter
        // Only if not already filtering by a specific one (or always to populate the dropdown)
        const goodsForFilter = await prisma.goods.findMany({
            where: isAdmin && targetUserId ? { userId: targetUserId } : (isAdmin ? {} : { userId }),
            select: { hsCode: true, description: true },
            distinct: ['hsCode']
        });
        const hsCodeList = goodsForFilter.map((g: any) => ({
            id: g.hsCode,
            name: g.description ? `${g.hsCode} - ${g.description}` : g.hsCode
        })).sort((a, b) => a.id.localeCompare(b.id));

        // If Admin, also provide list of users/companies for the filter
        let companies: any[] = [];
        if (isAdmin) {
            companies = await prisma.user.findMany({
                where: { role: "CLIENT" },
                select: { id: true, companyName: true, email: true }
            });
        }

        return NextResponse.json({
            stats: {
                countBL,
                count20,
                count40,
                totalTonnage,
                goodsList,
                destList,
                monthlyStats,
                hsCodeList
            },
            companies,
            isAdmin
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
