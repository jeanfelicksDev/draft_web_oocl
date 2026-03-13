import { prisma } from "./prisma";

export async function createBLSnapshot(blId: string) {
    const bl = await prisma.billOfLading.findUnique({
        where: { id: blId },
        include: {
            containers: true,
            shipper: true,
            consignee: true,
            notify: true,
            alsoNotify: true,
            forwarder: true,
            freightBuyer: true,
            goods: true,
            typeReleased: true,
        }
    });

    if (!bl) return null;

    return {
        bookingNumber: bl.bookingNumber,
        contractNumber: bl.contractNumber,
        portCountryText: bl.portCountryText,
        portCityText: bl.portCityText,
        typeReleased: bl.typeReleased?.name || "",
        shipper: bl.shipper || {},
        consignee: bl.consignee || {},
        notify: bl.notify || {},
        alsoNotify: bl.alsoNotify?.description || "",
        forwarder: bl.forwarder || {},
        freightBuyer: bl.freightBuyer || {},
        goods: {
            description: bl.goods?.description || "",
            hsCode: bl.goods?.hsCode || "",
            declNo: bl.goods?.declNo || "",
        },
        containers: bl.containers || []
    };
}
