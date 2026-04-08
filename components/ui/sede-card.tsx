"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface SedeCardProps {
  sede: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    horario: string;
    imagenes: string[];
  };
  index: number;
}

export function SedeCard({ sede, index }: SedeCardProps) {
  const [showMap, setShowMap] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Generar URL de Google Maps usando la dirección
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(sede?.direccion + ', ' + sede?.ciudad)}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sede?.direccion + ', ' + sede?.ciudad)}`;

  // Auto-rotación de imágenes con transición suave
  useEffect(() => {
    if (sede?.imagenes && sede.imagenes.length > 1) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentImageIndex((prev) => (prev + 1) % sede.imagenes.length);
          setIsTransitioning(false);
        }, 300); // Duración del fade out
      }, 3000); // Cambiar imagen cada 3 segundos

      return () => clearInterval(interval);
    }
  }, [sede?.imagenes]);

  // Obtener la imagen actual
  const currentImage = sede?.imagenes?.[currentImageIndex] || "https://cdn.abacus.ai/images/d9570e29-20cc-4090-b76d-62f460a6b818.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/sedes/${sede?.id ?? ""}`} className="block">
        <div className="rounded-2xl overflow-hidden bg-[#141414] border border-white/10 hover:border-[#D604E0]/50 transition-all duration-300 card-glow-hover">
          {/* Imagen o Mapa */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {showMap ? (
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="object-cover"
                title={`Mapa de ${sede?.nombre ?? "Sede"}`}
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={currentImage}
                  alt={sede?.nombre ?? "Sede"}
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 3}
                  className={`object-cover group-hover:scale-105 transition-all duration-700 ${
                    isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                />
                
                {/* Indicador de imágenes */}
                {sede?.imagenes && sede.imagenes.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    {sede.imagenes.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Botón para ver mapa */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMap(!showMap);
              }}
              className="absolute top-4 right-4 bg-[#141414]/80 backdrop-blur-sm border border-white/20 text-white rounded-full p-2 hover:bg-[#D604E0]/20 transition-colors z-10"
              title={showMap ? "Ver imagen" : "Ver mapa"}
            >
              <MapPin className="w-4 h-4" />
            </button>
            
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white mb-1">{sede?.nombre ?? ""}</h3>
              <p className="text-gray-300 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#D604E0]" />
                {sede?.direccion ?? ""}, {sede?.ciudad ?? ""}
              </p>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-gray-400 text-sm flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#040AE0]" />
              <span className="line-clamp-1">{sede?.horario?.split("|")[0] ?? ""}</span>
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[#D604E0] text-sm font-medium hover:text-[#D604E0]/80 transition-colors"
                >
                  Ver más detalles
                </span>
                <span className="text-gray-500">•</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="text-[#040AE0] text-sm font-medium hover:text-[#040AE0]/80 transition-colors flex items-center gap-1"
                  title="Cómo llegar"
                >
                  <ExternalLink className="w-3 h-3" />
                  Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
