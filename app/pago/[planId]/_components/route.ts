import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  const { linkId } = params;

  if (!linkId) {
    return NextResponse.json({ error: "linkId requerido" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.bold.co/online/link/v1/${linkId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.BOLD_API_KEY}`,
      },
    });

    const data = await response.json();

    return NextResponse.json({
      status: data.status,
      data: data,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al consultar estado" }, { status: 500 });
  }
}