'use client'

// ============================================
// UCD Optimization #8: Severity Input with Labels
// Replaces bare number input with labeled,
// tappable segmented control. Each level has a
// semantic label and color-coded visual.
// ============================================

type SeverityLevel = {
  value: number
  label: string
  shortLabel: string
  color: string
  bgColor: string
  ringColor: string
  dotColor: string
}

const SEVERITY_LEVELS: SeverityLevel[] = [
  { value: 1, label: 'Minimal', shortLabel: 'Min', color: 'text-green-700', bgColor: 'bg-green-50', ringColor: 'ring-green-300', dotColor: 'bg-green-400' },
  { value: 2, label: 'Mild', shortLabel: 'Mild', color: 'text-lime-700', bgColor: 'bg-lime-50', ringColor: 'ring-lime-300', dotColor: 'bg-lime-400' },
  { value: 3, label: 'Moderate', shortLabel: 'Mod', color: 'text-amber-700', bgColor: 'bg-amber-50', ringColor: 'ring-amber-300', dotColor: 'bg-amber-400' },
  { value: 4, label: 'Significant', shortLabel: 'Sig', color: 'text-orange-700', bgColor: 'bg-orange-50', ringColor: 'ring-orange-300', dotColor: 'bg-orange-400' },
  { value: 5, label: 'Severe', shortLabel: 'Sev', color: 'text-red-700', bgColor: 'bg-red-50', ringColor: 'ring-red-300', dotColor: 'bg-red-400' },
]

type SeverityPickerProps = {
  value: number
  onChange: (value: number) => void
  id?: string
  label?: string
}

export function SeverityPicker({ value, onChange, id = 'severity', label = 'Severity' }: SeverityPickerProps) {
  const selected = SEVERITY_LEVELS.find(l => l.value === value)

  return (
    <fieldset className="mb-4">
      <legend className="block text-sm font-medium text-body mb-2">{label}</legend>
      <div
        className="grid grid-cols-5 gap-1.5"
        role="radiogroup"
        aria-label={label}
      >
        {SEVERITY_LEVELS.map(level => {
          const isSelected = value === level.value
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${level.label} (${level.value} of 5)`}
              onClick={() => onChange(level.value)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:${level.ringColor}
                ${isSelected
                  ? `${level.bgColor} ${level.color} ring-2 ${level.ringColor} shadow-sm`
                  : 'bg-gray-50 text-slate hover:bg-gray-100'
                }`}
            >
              {/* Dot indicator */}
              <span className={`w-3 h-3 rounded-full transition-colors ${
                isSelected ? level.dotColor : 'bg-gray-200'
              }`} />
              {/* Label - full on sm+, short on mobile */}
              <span className="text-[10px] sm:text-xs font-medium leading-tight hidden sm:block">{level.label}</span>
              <span className="text-[10px] font-medium leading-tight sm:hidden">{level.shortLabel}</span>
              {/* Number */}
              <span className="text-[9px] text-slate">{level.value}/5</span>
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="text-xs text-slate mt-1.5 sr-only" aria-live="polite">
          Severity set to {selected.label} ({selected.value} of 5)
        </p>
      )}
    </fieldset>
  )
}

// Accessible severity dots for display (read-only)
// Optimization #9: adds screen reader text
export function SeverityDots({ severity }: { severity: number }) {
  const level = SEVERITY_LEVELS.find(l => l.value === severity)
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5" aria-hidden="true">
        {SEVERITY_LEVELS.map(l => (
          <span
            key={l.value}
            className={`w-2 h-2 rounded-full ${
              l.value <= severity ? l.dotColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="sr-only">Severity: {level?.label || severity} out of 5</span>
    </div>
  )
}

// Severity badge for compact display
export function SeverityBadge({ severity }: { severity: number }) {
  const level = SEVERITY_LEVELS.find(l => l.value === severity)
  if (!level) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${level.bgColor} ${level.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level.dotColor}`} aria-hidden="true" />
      {level.label}
    </span>
  )
}

export { SEVERITY_LEVELS }
