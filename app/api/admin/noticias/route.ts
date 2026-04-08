import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const noticias = await prisma.noticia.findMany({
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechaPublicacion: "desc" },
    });

    return NextResponse.json(noticias);
  } catch (error) {
    console.error("Error fetching noticias:", error);
    return NextResponse.json(
      { error: "Error al obtener noticias" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Datos recibidos en API:", JSON.stringify(body, null, 2));
    
    const {
      titulo,
      contenido,
      resumen,
      imagen,
      sedeId,
      esPromocion,
      fechaInicio,
      fechaFin,
      activo,
      destacado,
    } = body;

    console.log("Campos extraídos:", { titulo, contenido, resumen, imagen, esPromocion });

    if (!titulo || !contenido) {
      console.log("Error: Campos requeridos faltantes", { titulo: !!titulo, contenido: !!contenido });
      return NextResponse.json(
        { error: "Faltan campos requeridos", details: { titulo: !!titulo, contenido: !!contenido } },
        { status: 400 }
      );
    }

    // Convertir content blocks a HTML si es un array
    let contenidoHtml = contenido;
    if (Array.isArray(contenido)) {
      contenidoHtml = contenido.map((block: any) => {
        switch (block.type) {
          case 'titulo':
            return `<h2 style="text-align: ${block.estilo?.alineacion || 'left'}; color: ${block.estilo?.color || '#000'}; font-size: ${block.estilo?.tamaño === 'grande' ? '2rem' : block.estilo?.tamaño === 'pequeño' ? '1rem' : '1.5rem'};">${block.content}</h2>`;
          case 'subtitulo':
            return `<h3 style="text-align: ${block.estilo?.alineacion || 'left'}; color: ${block.estilo?.color || '#000'}; font-size: ${block.estilo?.tamaño === 'grande' ? '1.5rem' : block.estilo?.tamaño === 'pequeño' ? '0.875rem' : '1.25rem'};">${block.content}</h3>`;
          case 'parrafo':
            return `<p style="text-align: ${block.estilo?.alineacion || 'left'}; color: ${block.estilo?.color || '#000'}; font-size: ${block.estilo?.tamaño === 'grande' ? '1.125rem' : block.estilo?.tamaño === 'pequeño' ? '0.875rem' : '1rem'};">${block.content}</p>`;
          case 'imagen':
            return `<div style="text-align: ${block.imageSettings?.posicion || 'left'}; margin: 1rem 0;">
              <img src="${block.imageSettings?.url || ''}" alt="${block.imageSettings?.alt || ''}" style="max-width: 100%; height: auto;" />
            </div>`;
          default:
            return `<p>${block.content}</p>`;
        }
      }).join('\n');
    }

    const noticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido: contenidoHtml,
        resumen,
        imagen,
        sedeId: sedeId || null,
        esPromocion,
        fechaInicio: esPromocion && fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: esPromocion && fechaFin ? new Date(fechaFin) : null,
        activo: activo ?? true,
        destacado: destacado ?? false,
      },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json(noticia);
  } catch (error) {
    console.error("Error creating noticia:", error);
    return NextResponse.json(
      { error: "Error al crear noticia" },
      { status: 500 }
    );
  }
}
