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
        const selectedYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

        // Build filters
        const filters: any = {};

        // Ownership filter
        if (isAdmin && targetUserId) {
            filters.userId = targetUserId;
        } else if (!isAdmin) {
            filters.userId = userId;
        } else if (isAdmin && !targetUserId) {
            // Admin viewing "global" stats - no specific userId filter
        }

        // Date filter
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) filters.createdAt.gte = new Date(startDate);
            if (endDate) filters.createdAt.lte = new Date(endDate);
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
        let countBL = bls.length;
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

        bls.forEach(bl => {
            const blDate = new Date(bl.createdAt);
            const blMonth = blDate.getMonth(); // 0-11
            const isSameYear = blDate.getFullYear() === selectedYear;

            // Containers
            bl.containers.forEach(cn => {
                const type = cn.typeTc.toLowerCase();
                let teu = 0;
                if (type.includes("20")) {
                    count20 += 1;
                    teu = 1;
                } else if (type.includes("40")) {
                    count40 += 1;
                    teu = 2;
                }

                totalTonnage += cn.grossWeight || 0;

                // Accumulate monthly stats if it's the right year
                if (isSameYear) {
                    monthlyStats[blMonth].tonnage += cn.grossWeight || 0;
                    monthlyStats[blMonth].teu += teu;
                }
            });

            // Goods (Percentage)
            const goodsName = bl.goods?.description || "Non spécifié";
            goodsMap[goodsName] = (goodsMap[goodsName] || 0) + 1;

            // Destinations
            const dest = bl.portCityText || bl.portCountryText || "Inconnu";
            destMap[dest] = (destMap[dest] || 0) + 1;
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
                monthlyStats
            },
            companies,
            isAdmin
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
