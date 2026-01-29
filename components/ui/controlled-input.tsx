"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface ControlledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'password' | 'date'
  showCharCount?: boolean
  format?: 'currency' | 'phone' | 'uppercase' | 'lowercase'
  showWarning?: boolean
}

const ControlledInput = React.forwardRef<HTMLInputElement, ControlledInputProps>(
  ({ className, maxLength, type, showCharCount, format, showWarning, onChange, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "")
    const [isExceeded, setIsExceeded] = React.useState(false)
    const [showWarnings, setShowWarnings] = React.useState(false)

    // Formatear el valor según el tipo
    const formatValue = (inputValue: string): string => {
      if (!inputValue) return inputValue

      switch (format) {
        case 'currency':
          // Solo permite números y hasta 2 decimales
          const numericValue = inputValue.replace(/[^0-9.]/g, '')
          const parts = numericValue.split('.')
          if (parts.length > 2) return parts[0] + '.' + parts[1]
          if (parts[1] && parts[1].length > 2) return parts[0] + '.' + parts[1].substring(0, 2)
          return numericValue

        case 'phone':
          // Formato de teléfono colombiano
          const phoneValue = inputValue.replace(/[^0-9]/g, '')
          if (phoneValue.length <= 10) return phoneValue
          return phoneValue.substring(0, 10)

        case 'uppercase':
          return inputValue.toUpperCase()

        case 'lowercase':
          return inputValue.toLowerCase()

        default:
          // Para password, no aplicar validación de caracteres especiales
          if (type === 'password') return inputValue
          // Para texto normal, permite letras, números, espacios y caracteres comunes
          return inputValue.replace(/[^a-zA-Z0-9\sáéíóúñÁÉÍÓÚüÜ.,;:¡!¿@#$%^&*()_+\-]/g, '')
      }
    }

    // Validar el valor según el tipo
    const validateValue = (inputValue: string): string => {
      if (!inputValue) return inputValue

      switch (type) {
        case 'number':
          // Para precios, permite hasta 15 dígitos antes del decimal
          const numericValue = inputValue.replace(/[^0-9.]/g, '')
          const parts = numericValue.split('.')
          if (parts[0] && parts[0].length > 15) return parts[0].substring(0, 15) + (parts[1] ? '.' + parts[1] : '')
          return numericValue

        case 'email':
          // Solo permite caracteres válidos para email
          return inputValue.replace(/[^a-zA-Z0-9@._-]/g, '')

        case 'tel':
          // Solo permite números para teléfono
          return inputValue.replace(/[^0-9]/g, '')

        case 'url':
          // Solo permite caracteres válidos para URL
          return inputValue.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]/g, '')

        case 'password':
          // Para password, permitir todos los caracteres
          return inputValue

        default:
          // Para texto normal, permitir letras, números, espacios y caracteres comunes
          return inputValue.replace(/[^a-zA-Z0-9\sáéíóúñÁÉÍÓÚüÜ.,;:¡!¿@#$%^&*()_+\-]/g, '')
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      // Aplicar formato primero
      newValue = formatValue(newValue)
      
      // Luego validar
      newValue = validateValue(newValue)

      // Aplicar maxLength si está definido - BLOQUEAR escritura
      if (maxLength && newValue.length > maxLength) {
        // No permitir escribir más caracteres
        setIsExceeded(true)
        return
      } else {
        setIsExceeded(false)
      }

      setInternalValue(newValue)
      
      // Llamar al onChange original con el valor formateado
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: value !== undefined && String(value) !== internalValue ? String(value) : newValue
          }
        }
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
      }
    }

    const handleContainerClick = () => {
      setShowWarnings(true)
      // Enfocar el input cuando se hace click en el contenedor
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
        <Input
          ref={ref}
          type={type}
          value={internalValue}
          onChange={handleChange}
          className={className}
          {...props}
        />
        {showCharCount && maxLength && showWarnings && (
          <div className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs pointer-events-none ${
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

ControlledInput.displayName = "ControlledInput"

export { ControlledInput }
