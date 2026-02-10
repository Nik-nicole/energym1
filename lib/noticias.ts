import { prisma } from "@/lib/db"

export async function getNoticias() {
  try {
    const noticias = await prisma.noticia.findMany({
      where: {
        activo: true
      },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fechaPublicacion: 'desc'
      }
    })

    return noticias
  } catch (error) {
    console.error("Error fetching noticias:", error)
    return []
  }
}

export async function getNoticiaById(id: string) {
  try {
    const noticia = await prisma.noticia.findUnique({
      where: {
        id,
        activo: true
      },
      include: {
        sede: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return noticia
  } catch (error) {
    console.error("Error fetching noticia:", error)
    return null
  }
}
