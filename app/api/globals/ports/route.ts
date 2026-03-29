import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const countryIdOrName = searchParams.get("country");

  if (!countryIdOrName) {
    return NextResponse.json([]);
  }

  try {
    const ports = await (prisma as any).globalPort.findMany({
      where: {
        OR: [
          { countryId: countryIdOrName },
          { country: { name: countryIdOrName } }
        ]
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(ports.map((p: any) => p.name));
  } catch (error: any) {
    console.error("Fetch ports error:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
