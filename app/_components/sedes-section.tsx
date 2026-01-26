"use client";

import { motion } from "framer-motion";
import { SedeCard } from "@/components/ui/sede-card";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  horario: string;
  imagen: string | null;
}

export function SedesSection({ sedes }: { sedes: Sede[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      align: 'start',
      skipSnaps: false,
      dragFree: true,
      containScroll: 'trimSnaps',
      loop: true
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onNavButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section id="sedes" className="py-20 bg-[#0A0A0A]">
      <div className="max-w-[1200px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D604E0]/10 rounded-full text-[#D604E0] text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Ubicaciones
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nuestras <span className="gradient-text">Sedes</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {(sedes?.length || 0)} ubicaciones estratégicas disponibles para que siempre tengas un
            FitZone cerca. Cada sede con carácter único pero la misma calidad
            premium.
          </p>
        </motion.div>

        {/* Carrusel Container */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {(sedes ?? []).map((sede, index) => (
                <div key={sede?.id ?? index} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3">
                  <SedeCard sede={sede} index={index} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {(sedes?.length || 0) > 1 && (
            <>
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#141414]/80 backdrop-blur-sm border border-[#1E1E1E] text-white rounded-full p-2 hover:bg-[#D604E0]/20 transition-colors z-10"
                onClick={scrollPrev}
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#141414]/80 backdrop-blur-sm border border-[#1E1E1E] text-white rounded-full p-2 hover:bg-[#D604E0]/20 transition-colors z-10"
                onClick={scrollNext}
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots Navigation */}
        {(sedes?.length || 0) > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? 'bg-[#D604E0] w-8'
                    : 'bg-[#1E1E1E] hover:bg-[#2A2A2A]'
                }`}
                onClick={() => onNavButtonClick(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Info dinámica */}
        {(sedes?.length || 0) === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Próximamente nuevas sedes disponibles</p>
          </div>
        )}
      </div>
    </section>
  );
}
