import type { User } from '../types'

interface AvatarProps {
  user: Pick<User, 'name' | 'initials'>
  size?: 'small' | 'medium' | 'large'
}

export function Avatar({ user, size = 'medium' }: AvatarProps) {
  return (
    <span className={`avatar avatar--${size}`} aria-label={user.name} title={user.name}>
      {user.initials}
    </span>
  )
}
