interface BadgeProps {
  value?: number
  label?: string
}

export function Badge({ value, label = 'Unread messages' }: BadgeProps) {
  if (!value) return null
  return <span className="badge" aria-label={`${value} ${label}`}>{value > 99 ? '99+' : value}</span>
}
