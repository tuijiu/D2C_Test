import { SendHorizontal } from 'lucide-react'
import { useState, type FormEvent } from 'react'

interface ComposerProps {
  disabled?: boolean
  onSend: (text: string) => Promise<void>
}

export function Composer({ disabled, onSend }: ComposerProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = text.trim()
    if (!value || disabled || sending) return
    setSending(true)
    try {
      await onSend(value)
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input
        aria-label="Message"
        disabled={disabled}
        maxLength={1000}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a message"
        value={text}
      />
      <button aria-label="Send message" disabled={!text.trim() || disabled || sending} title="Send message">
        <SendHorizontal aria-hidden="true" size={20} />
      </button>
    </form>
  )
}
