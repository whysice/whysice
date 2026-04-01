'use client'

import { useState, useCallback, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'

// ============================================
// UCD Optimization #3: Inline Form Validation
// Provides field-level error messages on blur,
// aria-invalid / aria-describedby, and consistent
// styling for all tracking forms.
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
        {required && <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>}
        {optional && <span className="text-slate font-normal ml-1">(optional)</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-slate mb-1.5">{hint}</p>
      )}

      {children}

      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1 flex items-center gap-1" role="alert">
          <span aria-hidden="true">⚠</span> {error}
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
        className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150
          focus:outline-none focus:ring-1
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-tanzanite-100 focus:border-tanzanite-500 focus:ring-tanzanite-200'
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
        className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150
          focus:outline-none focus:ring-1
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-tanzanite-100 focus:border-tanzanite-500 focus:ring-tanzanite-200'
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
        className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150 resize-none
          focus:outline-none focus:ring-1
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-tanzanite-100 focus:border-tanzanite-500 focus:ring-tanzanite-200'
          }`}
        {...textareaProps}
      />
    </FieldWrapper>
  )
}
