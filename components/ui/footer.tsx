import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image 
                src="/logo_Energym.png" 
                alt="Energym Logo" 
                width={128} 
                height={128}
                className="w-32 h-32"
              />
            </Link>
            <p className="text-gray-400 text-sm">
              Transforma tu vida con nosotros.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Nuestras Redes Sociales</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://instagram.com/energym_trainer" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#D604E0] transition-colors text-sm">
                  Instagram: @energym_trainer
                </a>
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
                info@energym.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
          <p>© 2026 Energym. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
