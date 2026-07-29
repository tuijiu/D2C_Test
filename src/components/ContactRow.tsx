import { MessageCircle, UserPlus } from 'lucide-react'
import type { User } from '../types'
import { Avatar } from './Avatar'

interface ContactRowProps {
  user: User
  action: 'add' | 'message'
  onAction: () => void
}

export function ContactRow({ user, action, onAction }: ContactRowProps) {
  const Icon = action === 'add' ? UserPlus : MessageCircle
  const label = action === 'add' ? `Add ${user.name}` : `Message ${user.name}`
  return (
    <article className="contact-row">
      <Avatar user={user} />
      <div className="contact-row__body">
        <strong>{user.name}</strong>
        <span className={`presence presence--${user.status.toLowerCase()}`}>{user.status}</span>
      </div>
      <button className="icon-button icon-button--soft" aria-label={label} title={label} onClick={onAction}>
        <Icon aria-hidden="true" size={18} />
      </button>
    </article>
  )
}
