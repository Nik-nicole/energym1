import Link from "next/link";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Página no encontrada</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 gradient-bg rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90"
            >
              <Home className="w-5 h-5" />
              Volver al inicio
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
              Regresar
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
