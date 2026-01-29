import { Metadata } from "next"
import { Suspense } from "react"
import { getNoticias } from "@/lib/noticias"
import { NoticiasGrid } from "./_components/noticias-grid"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export const metadata: Metadata = {
  title: "Noticias - FitZone",
  description: "Manténte informado sobre las últimas novedades, eventos y ofertas especiales de FitZone.",
}

export default async function NoticiasPage() {
  const noticias = await getNoticias()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Todas las <span className="gradient-text">Noticias</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explora todas nuestras noticias, eventos y promociones especiales
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <NoticiasGrid noticias={noticias} />
        </Suspense>
      </div>
    </div>
  )
}
