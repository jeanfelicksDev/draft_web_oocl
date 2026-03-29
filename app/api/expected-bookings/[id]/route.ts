import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-utils";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const bookingId = params.id;
        console.log("Deleting Rotation Booking:", bookingId);

        await (prisma as any).rotationBooking.delete({
            where: { id: bookingId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Booking Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
