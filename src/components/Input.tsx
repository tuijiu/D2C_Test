import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className={`search-input ${className}`}>
      <Search aria-hidden="true" size={18} strokeWidth={1.8} />
      <span className="sr-only">{label}</span>
      <input aria-label={label} {...props} />
    </label>
  )
}
