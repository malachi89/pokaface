interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
  autoComplete?: string
}

export function Input({
  value,
  onChange,
  placeholder,
  disabled = false,
  maxLength,
  className = '',
  autoComplete,
}: InputProps) {
  const baseClass =
    'w-full px-4 py-2 bg-surface-2 border border-surface-3 rounded text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors'

  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      autoComplete={autoComplete}
      className={`${baseClass} ${className}`}
    />
  )
}
