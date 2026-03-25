"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

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
  
  // Generar URL de Google Maps usando la dirección
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(sede?.direccion + ', ' + sede?.ciudad)}`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sede?.direccion + ', ' + sede?.ciudad)}`;

  // Función para cambiar a la siguiente imagen
  const nextImage = () => {
    if (sede?.imagenes && sede.imagenes.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % sede.imagenes.length);
    }
  };

  // Función para cambiar a la imagen anterior
  const prevImage = () => {
    if (sede?.imagenes && sede.imagenes.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + sede.imagenes.length) % sede.imagenes.length);
    }
  };

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
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Controles del carrusel si hay múltiples imágenes */}
                {sede?.imagenes && sede.imagenes.length > 1 && (
                  <>
                    {/* Botones anterior/siguiente */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                      title="Imagen anterior"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                      title="Siguiente imagen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Indicador de imágenes */}
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
                  </>
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
              <ArrowRight className="w-5 h-5 text-[#D604E0] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
