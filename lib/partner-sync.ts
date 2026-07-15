import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function getSharedPartners(userId: string) {
    const [consignees, notifys, alsoNotifys] = await Promise.all([
        prisma.consignee.findMany({ where: { userId } }),
        prisma.notify.findMany({ where: { userId } }),
        prisma.alsoNotify.findMany({ where: { userId } }),
    ]);

    const mergedMap = new Map<string, any>();

    const addRecord = (item: any, type: string) => {
        const name = (item.name || "").trim();
        const address = (item.address || "").trim();
        // Skip empty records
        if (!name && !address) return;

        const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
        if (!mergedMap.has(key)) {
            mergedMap.set(key, {
                id: item.id,
                name,
                address,
                country: item.country || "",
                city: item.city || "",
                phone: item.phone || "",
                email: item.email || "",
                vat: item.vat || null,
                eori: item.eori || null,
                bin: item.bin || null,
                usci: item.usci || null,
                saveStatus: item.saveStatus || "VALIDATED",
                userId,
                inConsignee: type === "consignee",
                inNotify: type === "notify",
                inAlsoNotify: type === "alsoNotify",
            });
        } else {
            const existing = mergedMap.get(key);
            existing.inConsignee = existing.inConsignee || (type === "consignee");
            existing.inNotify = existing.inNotify || (type === "notify");
            existing.inAlsoNotify = existing.inAlsoNotify || (type === "alsoNotify");
            
            // Merge missing fields
            if (!existing.vat && item.vat) existing.vat = item.vat;
            if (!existing.eori && item.eori) existing.eori = item.eori;
            if (!existing.bin && item.bin) existing.bin = item.bin;
            if (!existing.usci && item.usci) existing.usci = item.usci;
            if (!existing.phone && item.phone) existing.phone = item.phone;
            if (!existing.email && item.email) existing.email = item.email;
            if (!existing.country && item.country) existing.country = item.country;
            if (!existing.city && item.city) existing.city = item.city;
        }
    };

    consignees.forEach(c => addRecord(c, "consignee"));
    notifys.forEach(n => addRecord(n, "notify"));
    alsoNotifys.forEach(a => addRecord(a, "alsoNotify"));

    const mergedList = Array.from(mergedMap.values());
    const syncPromises: Promise<any>[] = [];

    for (const partner of mergedList) {
        const payload = {
            name: partner.name,
            address: partner.address,
            country: partner.country,
            city: partner.city,
            phone: partner.phone,
            email: partner.email,
            vat: partner.vat,
            eori: partner.eori,
            bin: partner.bin,
            usci: partner.usci,
            saveStatus: partner.saveStatus,
            userId,
        };

        if (!partner.inConsignee || !partner.inNotify || !partner.inAlsoNotify) {
            syncPromises.push(
                prisma.consignee.upsert({
                    where: { id: partner.id },
                    update: payload,
                    create: { id: partner.id, ...payload }
                }),
                prisma.notify.upsert({
                    where: { id: partner.id },
                    update: payload,
                    create: { id: partner.id, ...payload }
                }),
                prisma.alsoNotify.upsert({
                    where: { id: partner.id },
                    update: payload,
                    create: { id: partner.id, ...payload }
                })
            );
        }
    }

    if (syncPromises.length > 0) {
        await Promise.all(syncPromises);
    }

    return mergedList.map(({ inConsignee, inNotify, inAlsoNotify, ...rest }) => rest)
                     .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function createSharedPartner(data: any, userId: string) {
    const id = crypto.randomUUID();
    const payload = {
        name: data.name || "",
        address: data.address || "",
        country: data.country || "",
        city: data.city || "",
        phone: data.phone || "",
        email: data.email || "",
        vat: data.vat || null,
        eori: data.eori || null,
        bin: data.bin || null,
        usci: data.usci || null,
        saveStatus: data.saveStatus || "VALIDATED",
        userId
    };

    const [newConsignee] = await Promise.all([
        prisma.consignee.create({ data: { id, ...payload } }),
        prisma.notify.create({ data: { id, ...payload } }),
        prisma.alsoNotify.create({ data: { id, ...payload } }),
    ]);

    return newConsignee;
}

export async function updateSharedPartner(id: string, data: any) {
    const payload = {
        name: data.name,
        address: data.address,
        country: data.country,
        city: data.city,
        phone: data.phone,
        email: data.email,
        vat: data.vat || null,
        eori: data.eori || null,
        bin: data.bin || null,
        usci: data.usci || null,
        saveStatus: data.saveStatus || "VALIDATED",
    };

    const [updated] = await Promise.all([
        prisma.consignee.update({ where: { id }, data: payload }),
        prisma.notify.update({ where: { id }, data: payload }),
        prisma.alsoNotify.update({ where: { id }, data: payload }),
    ]);

    return updated;
}

export async function deleteSharedPartner(id: string) {
    await Promise.all([
        prisma.consignee.delete({ where: { id } }).catch(() => {}),
        prisma.notify.delete({ where: { id } }).catch(() => {}),
        prisma.alsoNotify.delete({ where: { id } }).catch(() => {}),
    ]);
}
