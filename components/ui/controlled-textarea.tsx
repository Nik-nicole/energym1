"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"

interface ControlledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number
  showCharCount?: boolean
  showWarning?: boolean
}

const ControlledTextarea = React.forwardRef<HTMLTextAreaElement, ControlledTextareaProps>(
  ({ className, maxLength, showCharCount, showWarning, onChange, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "")
    const [isExceeded, setIsExceeded] = React.useState(false)
    const [showWarnings, setShowWarnings] = React.useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value

      // Permitir caracteres comunes en español y símbolos básicos
      newValue = newValue.replace(/[^a-zA-Z0-9\sáéíóúñÁÉÍÓÚüÜ.,;:¡!¿@#$%^&*()_+\-]/g, '')

      // Aplicar maxLength si está definido - BLOQUEAR escritura
      if (maxLength && newValue.length > maxLength) {
        // No permitir escribir más caracteres
        setIsExceeded(true)
        return
      } else {
        setIsExceeded(false)
      }

      setInternalValue(newValue)
      
      // Llamar al onChange original
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue
          }
        }
        onChange(syntheticEvent as React.ChangeEvent<HTMLTextAreaElement>)
      }
    }

    const handleContainerClick = () => {
      setShowWarnings(true)
      
      // Enfocar el textarea cuando se hace click en el contenedor
      if (ref && typeof ref === 'object' && ref.current) {
        ref.current.focus()
      }
    }

    // Sincronizar con el valor externo
    React.useEffect(() => {
      if (value !== undefined && String(value) !== internalValue) {
        setInternalValue(String(value))
      }
    }, [value, internalValue])

    return (
      <div className="relative" onClick={handleContainerClick}>
        <Textarea
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          className={className}
          {...props}
        />
        {showCharCount && maxLength && showWarnings && (
          <div className={`absolute right-2 bottom-2 text-xs pointer-events-none ${
            String(internalValue).length >= maxLength 
              ? 'text-red-400 font-semibold' 
              : String(internalValue).length >= maxLength * 0.9 
                ? 'text-yellow-400' 
                : 'text-[#A0A0A0]'
          }`}>
            {String(internalValue).length}/{maxLength}
          </div>
        )}
        {showWarning && maxLength && showWarnings && (
          <div className="mt-1 pointer-events-none">
            <p className="text-xs text-[#A0A0A0]">
              Máximo {maxLength} caracteres permitidos
            </p>
            {isExceeded && (
              <p className="text-xs text-red-400 font-medium">
                ⚠️ Has excedido el límite de {maxLength} caracteres
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

ControlledTextarea.displayName = "ControlledTextarea"

export { ControlledTextarea }
