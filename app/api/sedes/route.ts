export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sedes = await prisma.sede.findMany({
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(sedes);
  } catch (error) {
    console.error("Error fetching sedes:", error);
    return NextResponse.json({ error: "Error al obtener sedes" }, { status: 500 });
  }
}
