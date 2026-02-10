import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getNoticiaById } from "@/lib/noticias"
import { NoticiaDetail } from "./_components/noticia-detail"

interface NoticiaPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: NoticiaPageProps): Promise<Metadata> {
  const noticia = await getNoticiaById(params.id)

  if (!noticia) {
    return {
      title: "Noticia no encontrada - FitZone",
    }
  }

  return {
    title: `${noticia.titulo} - FitZone`,
    description: noticia.resumen || noticia.titulo,
    openGraph: {
      title: noticia.titulo,
      description: noticia.resumen || noticia.titulo,
      images: noticia.imagen ? [noticia.imagen] : [],
    },
  }
}

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  const noticia = await getNoticiaById(params.id)

  if (!noticia) {
    notFound()
  }

  return <NoticiaDetail noticia={noticia} />
}
