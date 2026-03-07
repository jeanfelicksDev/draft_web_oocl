import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateBLPDF(data: any, preview: boolean = true) {
    const doc = new jsPDF();

    // Helpers
    const drawSectionBox = (title: string, x: number, y: number, w: number, h: number, details: any) => {
        const { name, address, country, city, phone, email } = details || {};

        doc.setFillColor(135, 206, 250);
        doc.rect(x, y, w, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0);
        doc.text(title, x + 2, y + 4.5);

        doc.setFontSize(7.5);
        let currentY = y + 10;

        if (name) {
            doc.setFont("helvetica", "bold");
            doc.text(name, x + 2, currentY);
            currentY += 4;
        }

        doc.setFont("helvetica", "normal");
        if (address) {
            const textLines = doc.splitTextToSize(address, w - 4);
            doc.text(textLines, x + 2, currentY);
            currentY += textLines.length * 3.5;
        }

        if (city || country) {
            doc.text(`${city || ""}${city && country ? ", " : ""}${country || ""}`, x + 2, currentY);
            currentY += 4;
        }

        if (phone) {
            doc.text(`TEL: ${phone}`, x + 2, currentY);
            currentY += 4;
        }

        if (email) {
            doc.text(`EMAIL: ${email}`, x + 2, currentY);
            currentY += 4;
        }

        // Conditional Fields
        const conditionals = [];
        if (details?.vat) conditionals.push(`VAT: ${details.vat}`);
        if (details?.eori) conditionals.push(`EORI: ${details.eori}`);
        if (details?.bin) conditionals.push(`BIN: ${details.bin}`);
        if (details?.usci) conditionals.push(`USCI: ${details.usci}`);

        if (conditionals.length > 0) {
            doc.text(conditionals.join(" | "), x + 2, currentY);
        }

        // Border
        doc.setDrawColor(200);
        doc.rect(x, y, w, h);
    };

    // --- Header Section ---
    doc.setFillColor(135, 206, 250); // Light blue for titles
    doc.rect(50, 10, 110, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("- - - SPECIMEN DRAFT OOCL - - -", 105, 15.5, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Booking Number", 50, 25);
    doc.text("Contract Number", 85, 25);
    doc.text("Type released", 120, 25);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(data.bookingNumber || "", 50, 30);
    doc.text(data.contractNumber || "", 85, 30);

    // TypeReleased can be an object or a string depending on how it's grabbed from the form
    const typeReleasedName = typeof data.typeReleased === 'object' ? data.typeReleased?.name : data.typeReleased;
    doc.text(typeReleasedName || "Original Bill of Loading (OBL)", 120, 30);

    // --- Grid Boxes ---
    const boxWidth = 90;
    const boxHeight = 45; // Slightly taller to fit more info
    const startY = 35;

    // Row 1: Shipper & Forwarder
    drawSectionBox("SHIPPER", 10, startY, boxWidth, boxHeight, data.shipper || {});
    drawSectionBox("FORWARDER", 110, startY, boxWidth, boxHeight, data.forwarder || {});

    // Row 2: Consignee & Also Notify
    drawSectionBox("CONSIGNEE", 10, startY + boxHeight + 5, boxWidth, boxHeight, data.consignee || {});

    drawSectionBox("ALSO NOTIFY", 110, startY + boxHeight + 5, boxWidth, boxHeight, {
        address: typeof data.alsoNotify === 'object' ? data.alsoNotify?.description : data.alsoNotify || ""
    });

    // Notify & Goods area
    drawSectionBox("NOTIFY", 10, startY + boxHeight * 2 + 10, boxWidth, boxHeight, data.notify || {});

    // Description Goods Box (Larger)
    doc.setFillColor(135, 206, 250);
    doc.rect(110, startY + boxHeight * 2 + 10, boxWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Description Goods", 112, startY + boxHeight * 2 + 14);
    doc.rect(110, startY + boxHeight * 2 + 10, boxWidth, 90); // Border
    doc.setFont("helvetica", "normal");
    const descriptionGoods = data.goods?.description || data.descriptionGoods || "";
    doc.text(descriptionGoods, 112, startY + boxHeight * 2 + 20, { maxWidth: 85 });

    // Freight Buyer
    drawSectionBox("FREIGHT BUYER", 10, startY + boxHeight * 3 + 15, boxWidth, boxHeight, data.freightBuyer || {});

    // Port & Place
    doc.setFillColor(230, 230, 230);
    doc.rect(10, 220, boxWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Port of Discharge", 12, 223);
    doc.setFont("helvetica", "bold");
    doc.text(data.portCountryText || "", 12, 227);

    doc.rect(10, 230, boxWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Place of delivery", 12, 233);
    doc.setFont("helvetica", "bold");
    doc.text(data.portCityText || "", 12, 237);

    // Codes at bottom right
    doc.setFontSize(9);
    doc.text(`HS CODE : ${data.goods?.hsCode || data.hsCode || ""}`, 112, 215);
    doc.text(`DECL N° : ${data.goods?.declNo || data.declNo || ""}`, 112, 220);

    // --- Containers Table ---
    const tableData = (data.containers || []).map((c: any) => [
        c.containerNum || "",
        c.typeTc || "",
        c.sealNum || "",
        c.count || "",
        c.packageType || "",
        c.grossWeight || "",
        c.netWeight || "",
        c.volume || ""
    ]);

    autoTable(doc, {
        startY: 245,
        head: [["CONTENEUR", "TYPE TC", "N° PLOMB", "NBRE", "PACKAGE", "GROSS WEIGHT", "NET WEIGHT", "VOLUME"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [0, 102, 153], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 1 },
        margin: { left: 10, right: 10 }
    });

    if (preview) {
        // Open in new tab
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    } else {
        return doc;
    }
}
