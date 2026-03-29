import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateBLPDF(data: any, preview: boolean = true) {
    const doc = new jsPDF();

    // Helper to draw section
    const drawSectionBox = (title: string, x: number, y: number, w: number, details: any, minH: number = 25) => {
        const { name, address, country, city, phone, email, vat, eori, bin, usci } = details || {};

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(230, 0, 18); // Red
        doc.text(title, x + 2, y + 4.5);
        
        // Underline
        const textWidth = doc.getTextWidth(title);
        doc.setDrawColor(230, 0, 18);
        doc.line(x + 2, y + 5, x + 2 + textWidth, y + 5);

        doc.setFontSize(7.5);
        let currentY = y + 10;

        if (name) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0);
            const nameLines = doc.splitTextToSize(name, w - 4);
            doc.text(nameLines, x + 2, currentY);
            currentY += nameLines.length * 4;
        }

        doc.setFont("helvetica", "normal");
        if (address) {
            doc.setTextColor(0);
            const textLines = doc.splitTextToSize(address, w - 4);
            doc.text(textLines, x + 2, currentY);
            currentY += textLines.length * 3.5;
        }

        if (city || country) {
            const currentLoc = `${city || ""}${city && country ? ", " : ""}${country || ""}`;
            doc.setTextColor(0);
            doc.text(currentLoc, x + 2, currentY);
            currentY += 4;
        }

        if (phone) {
            doc.setTextColor(0);
            doc.text(`TEL: ${phone}`, x + 2, currentY);
            currentY += 4;
        }

        if (email) {
            doc.setTextColor(0);
            doc.text(`EMAIL: ${email}`, x + 2, currentY);
            currentY += 4;
        }

        // Conditional Fields
        const conditionals = [];
        if (vat) conditionals.push({ label: "VAT", val: vat });
        if (eori) conditionals.push({ label: "EORI", val: eori });
        if (bin) conditionals.push({ label: "BIN", val: bin });
        if (usci) conditionals.push({ label: "USCI", val: usci });

        if (conditionals.length > 0) {
            let startX = x + 2;
            doc.setTextColor(0);
            conditionals.forEach((c, idx) => {
                const text = `${c.label}: ${c.val}${idx < conditionals.length - 1 ? " | " : ""}`;
                doc.text(text, startX, currentY);
                startX += doc.getTextWidth(text);
            });
            currentY += 4;
        }

        const finalH = Math.max(minH, currentY - y + 2);
        // Reset color and draw Border
        doc.setTextColor(0);
        doc.setDrawColor(200);
        doc.roundedRect(x, y, w, finalH, 2, 2);
        return finalH;
    };

    // --- Header Section ---
    // Logos
    try {
        // OOCL Logo (Left) - Square 1:1
        doc.addImage("/logo-oocl.png", "PNG", 10, 5, 20, 20);
    } catch (e) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(230, 0, 18);
        doc.text("OOCL", 10, 12);
    }

    try {
        // AGL Logo (Right) - Ratio 129:80 ~ 1.61
        const aglW = 25;
        const aglH = (aglW * 80) / 129;
        doc.addImage("/logo-agl.png", "PNG", 175, 5, aglW, aglH);
    } catch (e) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0, 68, 170); // #0044aa
        doc.text("AGL", 195, 12, { align: "right" });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    let headerTitle = "- - - SPECIMEN DRAFT OOCL - - -";
    doc.text(headerTitle, 105, 15.5, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text("Booking Number", 40, 25, { align: "center" });
    doc.text("Contract Number", 83, 25, { align: "center" });
    doc.text("Ship / Vessel", 126, 25, { align: "center" });
    doc.text("Voyage", 170, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(data.bookingNumber || "", 40, 30, { align: "center" });
    doc.text(data.contractNumber || "", 83, 30, { align: "center" });
    doc.text(data.vessel || "", 126, 30, { align: "center" });
    doc.text(data.voyage || "", 170, 30, { align: "center" });

    doc.setFontSize(8);
    doc.text("Type released", 10, 38);
    doc.text("ETD Date", 110, 38);

    doc.setFontSize(10);
    const typeReleasedName = typeof data.typeReleased === 'object' ? data.typeReleased?.name : data.typeReleased;
    doc.text(typeReleasedName || "", 10, 43);
    doc.text(data.etd ? new Date(data.etd).toLocaleDateString() : "", 110, 43);

    // --- Grid Boxes ---
    const boxWidth = 90;
    const startY = 48;
    const gap = 5;
    let leftY = startY;
    let rightY = startY;

    // Left Column: Shipper -> Consignee -> Notify -> Freight Buyer -> Ports
    // Right Column: Forwarder -> Also Notify -> Description Goods

    // Shipper (Left) & Forwarder (Right)
    const hShipper = drawSectionBox("SHIPPER", 10, leftY, boxWidth, data.shipper);
    const hForwarder = drawSectionBox("FORWARDER", 110, rightY, boxWidth, data.forwarder);
    leftY += hShipper + gap;
    rightY += hForwarder + gap;

    // Consignee (Left) & Also Notify (Right)
    const hConsignee = drawSectionBox("CONSIGNEE", 10, leftY, boxWidth, data.consignee);
    const currentAlso = typeof data.alsoNotify === 'object' ? data.alsoNotify?.description : data.alsoNotify || "";
    const hAlso = drawSectionBox("ALSO NOTIFY", 110, rightY, boxWidth, { address: currentAlso || "" });
    leftY += hConsignee + gap;
    rightY += hAlso + gap;

    // Notify (Left) & Description Goods (Right)
    const hNotify = drawSectionBox("NOTIFY", 10, leftY, boxWidth, data.notify);
    
    // Description Goods Box (Dynamic Right)
    const descX = 110;
    const descY = rightY;
    const descriptionGoods = data.goods?.description || data.descriptionGoods || "";
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const gLines = doc.splitTextToSize(descriptionGoods, boxWidth - 4);
    const textH = gLines.length * 4;
    const hs = data.goods?.hsCode || data.hsCode || "";
    const decl = data.goods?.declNo || data.declNo || "";
    const codeH = (hs || decl) ? 10 : 0;
    const hGoods = Math.max(45, textH + codeH + 12);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(230, 0, 18); // RED
    doc.text("DESCRIPTION OF GOODS", descX + 2, descY + 4.5);
    const descTitleWidth = doc.getTextWidth("DESCRIPTION OF GOODS");
    doc.setDrawColor(230, 0, 18);
    doc.line(descX + 2, descY + 5, descX + 2 + descTitleWidth, descY + 5);
    
    doc.setDrawColor(200);
    doc.roundedRect(descX, descY, boxWidth, hGoods, 2, 2); 
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0);
    doc.text(gLines, descX + 2, descY + 10);
    
    if (hs || decl) {
        doc.setFont("helvetica", "normal");
        const codeY = descY + hGoods - (decl ? 8 : 4);
        doc.setTextColor(0);
        if (hs) doc.text(`HS CODE : ${hs}`, descX + 2, codeY);
        if (decl) doc.text(`DECL N° : ${decl}`, descX + 2, codeY + 4);
    }
    
    leftY += hNotify + gap;
    rightY += hGoods + gap;

    // Freight Buyer (Left)
    const hFreight = drawSectionBox("FREIGHT BUYER", 10, leftY, boxWidth, data.freightBuyer);
    leftY += hFreight + gap;

    // Port & Place (Same line)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(230, 0, 18);
    
    // PORT OF DISCHARGE
    const podLabel = "PORT OF DISCHARGE";
    doc.text(podLabel, 12, leftY + 3);
    const podW = doc.getTextWidth(podLabel);
    doc.setDrawColor(230, 0, 18);
    doc.line(12, leftY + 3.5, 12 + podW, leftY + 3.5);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(data.portCountryText || "", 12, leftY + 7);

    // PLACE OF DELIVERY (Right Column)
    const secondColX = 70;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(230, 0, 18);
    const polLabel = "PLACE OF DELIVERY";
    doc.text(polLabel, secondColX, leftY + 3);
    const polW = doc.getTextWidth(polLabel);
    doc.line(secondColX, leftY + 3.5, secondColX + polW, leftY + 3.5);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(data.portCityText || "", secondColX, leftY + 7);

    leftY += 12; 
    

    leftY += 5; // Reduced padding before table

    const tableStartY = Math.max(leftY, rightY);

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
        startY: tableStartY,
        head: [["CONTENEUR", "TYPE TC", "NBRE PLOMB", "NBRE", "PACKAGE", "GROSS WEIGHT", "NET WEIGHT", "VOLUME"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [176, 196, 222], textColor: [0, 0, 0], fontSize: 7, fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.3 },
        styles: { fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3 },
        margin: { left: 10, right: 10 },
    });

    const cleanBookingNum = String(data.bookingNumber || "").trim();
    const filename = cleanBookingNum ? `SI_${cleanBookingNum}.pdf` : "Shipping_Instructions.pdf";
    
    doc.setProperties({
        title: filename.replace('.pdf', ''),
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    
    if (preview) {
        const win = window.open(url, "_blank");
        if (win) {
            win.document.title = filename.replace('.pdf', '');
        }
    } else {
        // Envoi vers l'API de sauvegarde bureau (si en local)
        const base64 = doc.output("datauristring").split(',')[1];
        fetch("/api/save-to-desktop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, base64 })
        }).catch(() => {});

        // Téléchargement standard
        doc.save(filename);

        // Ouverture automatique dans un nouvel onglet
        const win = window.open(url, "_blank");
        if (win) {
            win.document.title = filename.replace('.pdf', '');
        }
    }
}
