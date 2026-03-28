import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

    const newCountry = await (prisma as any).globalCountry.create({
      data: { name: name.trim().toUpperCase() }
    });

    return NextResponse.json(newCountry);
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "Ce pays existe déjà" }, { status: 409 });
    console.error("Create country error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
