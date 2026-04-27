'use client'

import { useState, useCallback, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

// ============================================
// WCAG 2.2 AA HARDENED — FormField.tsx
//
// Compliance focus:
//   1.4.1 Use of Color (A)
//     - Error state already conveyed via icon + text + aria-invalid;
//       upgraded the icon from a unicode ⚠ glyph to a proper
//       lucide AlertCircle (more reliable cross-platform rendering).
//
//   1.4.3 Contrast Minimum (AA, 4.5:1)
//     - Required-marker asterisk: text-red-400 → text-red-700 on white
//       (3.0:1 → 6.7:1)
//     - Error message text: text-red-500 → text-red-700 (4.0:1 → 6.7:1)
//
//   1.4.11 Non-text Contrast (AA, 3:1)
//     - Error border: border-red-300 → border-red-600 on white
//       (~2.5:1 → ~4.8:1)
//     - Default border kept tanzanite-100 because the affordance is
//       provided by the visible label above the field, not the border
//       (per W3C Understanding 1.4.11: "The visual information required
//       to identify a UI component"). Borders here are decorative.
//
//   3.3.1 Error Identification (A) — error programmatically associated
//   via aria-describedby and announced via role="alert".
// ============================================

type ValidationRule = {
  test: (value: string) => boolean
  message: string
}

type BaseFieldProps = {
  label: string
  id: string
  required?: boolean
  optional?: boolean
  hint?: string
  validationRules?: ValidationRule[]
  error?: string | null
  children?: ReactNode
}

export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validate = useCallback((fieldId: string, value: string, rules: ValidationRule[], required?: boolean): string | null => {
    if (required && !value.trim()) {
      return 'This field is required'
    }
    for (const rule of rules) {
      if (!rule.test(value)) {
        return rule.message
      }
    }
    return null
  }, [])

  const onBlur = useCallback((fieldId: string, value: string, rules: ValidationRule[] = [], required?: boolean) => {
    setTouched(prev => ({ ...prev, [fieldId]: true }))
    const error = validate(fieldId, value, rules, required)
    setErrors(prev => ({ ...prev, [fieldId]: error }))
    return error
  }, [validate])

  const validateAll = useCallback((fields: { id: string; value: string; rules?: ValidationRule[]; required?: boolean }[]): boolean => {
    let valid = true
    const newErrors: Record<string, string | null> = {}
    const newTouched: Record<string, boolean> = {}

    for (const field of fields) {
      newTouched[field.id] = true
      const error = validate(field.id, field.value, field.rules || [], field.required)
      newErrors[field.id] = error
      if (error) valid = false
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    setTouched(prev => ({ ...prev, ...newTouched }))
    return valid
  }, [validate])

  const clearError = useCallback((fieldId: string) => {
    setErrors(prev => ({ ...prev, [fieldId]: null }))
  }, [])

  const resetValidation = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return {
    errors,
    touched,
    onBlur,
    validateAll,
    clearError,
    resetValidation,
    getFieldError: (id: string) => touched[id] ? errors[id] : null,
  }
}

// Wrapper that adds label, error message, hint, and aria attributes
function FieldWrapper({ label, id, required, optional, hint, error, children }: BaseFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-body mb-1">
        {label}
        {/* WCAG 1.4.3: red-700 (6.7:1) instead of red-400 (3.0:1) */}
        {required && (
          <>
            <span className="text-red-700 ml-0.5" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
        {optional && <span className="text-body/70 font-normal ml-1">(optional)</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-body/70 mb-1.5">{hint}</p>
      )}

      {children}

      {error && (
        <p
          id={errorId}
          className="text-xs text-red-700 mt-1 flex items-center gap-1 font-medium"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

// Validated text/date/email input
type ValidatedInputProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement> & {
  value: string
  onValueChange: (value: string) => void
  onValidate?: (id: string, value: string) => void
}

export function ValidatedInput({
  label, id, required, optional, hint, error,
  value, onValueChange, onValidate,
  validationRules, children,
  ...inputProps
}: ValidatedInputProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <FieldWrapper label={label} id={id} required={required} optional={optional} hint={hint} error={error}>
      <input
        id={id}
        value={value}
        onChange={e => onValueChange(e.target.value)}
        onBlur={() => onValidate?.(id, value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required}
        // WCAG 1.4.11: red-600 on white ≈ 4.8:1, clears 3:1 with margin
        className={`w-full px-3 py-2 rounded-lg border-2 text-sm text-body transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${error
            ? 'border-red-700 focus:border-red-700 focus:ring-red-300 bg-red-50/30'
            : 'border-tanzanite-100 focus:border-tanzanite-500 focus:ring-tanzanite-300'
          }`}
        {...inputProps}
      />
    </FieldWrapper>
  )
}

// Validated select
type ValidatedSelectProps = BaseFieldProps & {
  value: string
  onValueChange: (value: string) => void
  onValidate?: (id: string, value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function ValidatedSelect({
  label, id, required, optional, hint, error,
  value, onValueChange, onValidate,
  options, placeholder,
}: ValidatedSelectProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <FieldWrapper label={label} id={id} required={required} optional={optional} hint={hint} error={error}>
      <select
        id={id}
        value={value}
        onChange={e => { onValueChange(e.target.value); onValidate?.(id, e.target.value) }}
        onBlur={() => onValidate?.(id, value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required}
        className={`w-full px-3 py-2 rounded-lg border-2 text-sm text-body transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${error
            ? 'border-red-700 focus:border-red-700 focus:ring-red-300 bg-red-50/30'
            : 'border-tanzanite-100 focus:border-tanzanite-500 focus:ring-tanzanite-300'
          }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FieldWrapper>
  )
}

// Validated textarea
type ValidatedTextareaProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & {
  value: string
  onValueChange: (value: string) => void
  onValidate?: (id: string, value: string) => void
}

export function ValidatedTextarea({
  label, id, required, optional, hint, error,
  value, onValueChange, onValidate,
  validationRules, children,
  ...textareaProps
}: ValidatedTextareaProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <FieldWrapper label={label} id={id} required={required} optional={optional} hint={hint} error={error}>
      <textarea
        id={id}
        value={value}
        onChange={e => onValueChange(e.target.value)}
        onBlur={() => onValidate?.(id, value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required}
        className={`w-full px-3 py-2 rounded-lg border-2 text-sm text-body transition-all duration-150 resize-none
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${error
            ? 'border-red-700 focus:border-red-700 focus:ring-red-300 bg-red-50/30'
            : 'border-tanzanite-100 focus:border-tanzanite-500 focus:ring-tanzanite-300'
          }`}
        {...textareaProps}
      />
    </FieldWrapper>
  )
}
