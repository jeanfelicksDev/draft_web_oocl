import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // RotationBooking feature désactivée (table non migrée en production)
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
