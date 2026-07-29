import type { ReactNode } from 'react'

interface TabProps {
  active: boolean
  icon?: ReactNode
  label: string
  onClick: () => void
}

export function Tab({ active, icon, label, onClick }: TabProps) {
  return (
    <button className="tab" aria-selected={active} role="tab" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
