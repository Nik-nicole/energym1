import { useState, useCallback } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean
  message?: string
}

interface ValidationRules {
  [fieldName: string]: ValidationRule
}

interface ValidationErrors {
  [fieldName: string]: string
}

export function useFormValidation(validationRules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validateField = useCallback((fieldName: string, value: string): string => {
    const rules = validationRules[fieldName]
    if (!rules) return ''

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return rules.message || 'Este campo es obligatorio'
    }

    // If field is empty and not required, skip other validations
    if (!value || value.trim() === '') {
      return ''
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return rules.message || `Mínimo ${rules.minLength} caracteres`
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.message || `Máximo ${rules.maxLength} caracteres`
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Formato inválido'
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      return rules.message || 'Valor inválido'
    }

    return ''
  }, [validationRules])

  const validateForm = useCallback((formData: { [fieldName: string]: string }): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    // Check all fields
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName] || '')
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validationRules, validateField])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }, [])

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0
  }
}

// Helper function to get input props with error styling
export function getInputProps(error: string) {
  return {
    className: error 
      ? "border-red-500 focus:ring-red-500/30 focus:border-red-500/50" 
      : "border-[#2A2A2A] focus:ring-[#040AE0]/30 focus:border-[#040AE0]/50",
    ...(error && { 
      'data-error': 'true',
      'aria-invalid': 'true'
    })
  }
}

// Helper function to get label props with error styling
export function getLabelProps(error: string) {
  return {
    className: error ? "text-red-400" : "text-gray-300"
  }
}
