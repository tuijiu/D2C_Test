import type { Conversation } from '../types'
import { Avatar } from './Avatar'
import { Badge } from './Badge'

interface ConversationRowProps {
  active?: boolean
  conversation: Conversation
  onClick: () => void
}

const timeFormatter = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false })

export function ConversationRow({ active, conversation, onClick }: ConversationRowProps) {
  const { user, lastMessage, unreadCount } = conversation
  return (
    <button className="conversation-row" data-active={active || undefined} onClick={onClick}>
      <Avatar user={user} />
      <span className="conversation-row__body">
        <strong>{user.name}</strong>
        <span>{lastMessage?.text ?? 'Start a conversation'}</span>
      </span>
      <span className="conversation-row__meta">
        <time dateTime={lastMessage?.createdAt}>
          {lastMessage ? timeFormatter.format(new Date(lastMessage.createdAt)) : ''}
        </time>
        <Badge value={unreadCount} />
      </span>
    </button>
  )
}
