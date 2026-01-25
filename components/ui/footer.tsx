import Link from "next/link";
import { Dumbbell, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-8 h-8 text-[#D604E0]" />
              <span className="text-2xl font-bold gradient-text">FitZone</span>
            </Link>
            <p className="text-gray-400 text-sm">
              La cadena de gimnasios líder en Bogotá. Transforma tu vida con nosotros.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Nuestras Sedes</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sedes/sede-norte" className="text-gray-400 hover:text-[#D604E0] transition-colors text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  FitZone Norte
                </Link>
              </li>
              <li>
                <Link href="/sedes/sede-centro" className="text-gray-400 hover:text-[#D604E0] transition-colors text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  FitZone Centro
                </Link>
              </li>
              <li>
                <Link href="/sedes/sede-sur" className="text-gray-400 hover:text-[#D604E0] transition-colors text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  FitZone Sur
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="w-4 h-4 text-[#040AE0]" />
                +57 601 123 4567
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-[#040AE0]" />
                info@fitzone.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
          <p>© 2026 FitZone. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
