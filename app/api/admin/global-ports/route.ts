import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId");
    if (!countryId) return NextResponse.json([]);

    const ports = await (prisma as any).globalPort.findMany({
      where: { countryId },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(ports);
  } catch (error) {
    console.error("Admin fetch ports error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { name, countryId } = await req.json();
    if (!name || !countryId) return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

    const newPort = await (prisma as any).globalPort.create({
      data: { name: name.trim().toUpperCase(), countryId }
    });

    return NextResponse.json(newPort);
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "Ce port existe déjà pour ce pays" }, { status: 409 });
    console.error("Create port error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
