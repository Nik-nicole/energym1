import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getNoticia(id: string) {
  try {
    const noticia = await prisma.noticia.findUnique({
      where: { id },
      include: { sede: { select: { nombre: true } } },
    });
    return noticia;
  } catch (error) {
    return null;
  }
}

export default async function NoticiaDetallePage({ params }: { params: { id: string } }) {
  const noticia = await getNoticia(params.id);

  if (!noticia || !noticia.activo) {
    notFound();
  }

  return (
      <article className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Botón Volver */}
          <Link href="/noticias" className="inline-flex items-center text-[#A0A0A0] hover:text-[#D604E0] mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a noticias
          </Link>

          {/* Encabezado del Artículo */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#D604E0]/10 text-[#D604E0] text-sm font-medium border border-[#D604E0]/20">
                {noticia.sede?.nombre || "General"}
              </span>
              {noticia.esPromocion && (
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium border border-orange-500/20">
                  Promoción
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {noticia.titulo}
            </h1>

            <div className="flex items-center gap-6 text-gray-400 text-sm border-b border-white/10 pb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(noticia.fechaPublicacion).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {noticia.sede && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{noticia.sede.nombre}</span>
                </div>
              )}
            </div>
          </div>

          {/* Imagen Principal */}
          {noticia.imagen && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img 
                src={noticia.imagen} 
                alt={noticia.titulo}
                className="w-full h-auto object-cover max-h-[600px]"
              />
            </div>
          )}

          {/* Contenido del Blog */}
          <div className="prose prose-invert max-w-none prose-lg prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-[#D604E0]">
            {/* Renderizamos el contenido preservando los saltos de ligne */}
            <div className="whitespace-pre-wrap leading-relaxed">
              {noticia.contenido}
            </div>
          </div>

        </div>
      </article>
  );
}