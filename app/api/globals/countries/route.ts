import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countries = await (prisma as any).globalCountry.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { ports: true }
        }
      }
    });

    return NextResponse.json(countries.map(c => ({
      id: c.id,
      name: c.name,
      portCount: c._count.ports
    })));
  } catch (error: any) {
    console.error("Fetch countries error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des pays" }, { status: 500 });
  }
}
