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
        alsoNotify: bl.alsoNotify || {},
        forwarder: bl.forwarder || {},
        freightBuyer: bl.freightBuyer || {},
        descriptionGoods: bl.descriptionGoods || bl.goods?.description || "",
        hsCode: bl.hsCode || bl.goods?.hsCode || "",
        containers: bl.containers || []
    };
}
