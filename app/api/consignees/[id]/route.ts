import { NextResponse } from "next/server";
import { updateSharedPartner, deleteSharedPartner } from "@/lib/partner-sync";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const updated = await updateSharedPartner(id, data);
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating consignee:", error);
        return NextResponse.json({ error: "Failed to update consignee" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteSharedPartner(id);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
