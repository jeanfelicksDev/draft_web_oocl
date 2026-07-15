import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

export function GET() {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === "BillOfLading");
    if (model) {
        return NextResponse.json({
            fields: model.fields.map(f => f.name)
        });
    }
    return NextResponse.json({ error: "BillOfLading model not found" }, { status: 404 });
}
