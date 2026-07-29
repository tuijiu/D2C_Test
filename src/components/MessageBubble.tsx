import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
  currentUserId: string
}

const timeFormatter = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false })

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const sent = message.senderId === currentUserId
  return (
    <article className={`message-bubble ${sent ? 'message-bubble--sent' : ''}`}>
      <p>{message.text}</p>
      <time dateTime={message.createdAt}>
        {timeFormatter.format(new Date(message.createdAt))}{sent && message.readBy.length > 1 ? ' · Read' : ''}
      </time>
    </article>
  )
}
