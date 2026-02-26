"use client";

import { useEffect, useRef } from "react";

export function useErrorScroll(errors: Record<string, string>) {
  const errorFieldsRef = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    // Scroll al primer campo con error
    const firstErrorField = Object.keys(errors)[0];
    
    if (firstErrorField && errorFieldsRef.current[firstErrorField]) {
      setTimeout(() => {
        const element = errorFieldsRef.current[firstErrorField];
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
          
          // Enfocar el campo
          element.focus();
          
          // Añadir efecto visual adicional
          element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
          }, 2000);
        }
      }, 100);
    }
  }, [errors]);

  const setFieldRef = (fieldName: string) => (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    errorFieldsRef.current[fieldName] = el;
  };

  return { setFieldRef };
}
