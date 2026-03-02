export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sedeQueries } from "@/lib/query-helpers";

export async function GET() {
  try {
    const sedes = await sedeQueries.all();
    return NextResponse.json(sedes);
  } catch (error) {
    console.error("Error fetching sedes:", error);
    return NextResponse.json(
      { error: "Error al obtener sedes" },
      { status: 500 }
    );
  }
}
