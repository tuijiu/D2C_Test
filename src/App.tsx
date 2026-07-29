import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react'
import { io } from 'socket.io-client'
import './App.css'
import { Avatar } from './components/Avatar'
import { Button } from './components/Button'
import { Composer } from './components/Composer'
import { ContactRow } from './components/ContactRow'
import { ConversationRow } from './components/ConversationRow'
import { Input } from './components/Input'
import { MessageBubble } from './components/MessageBubble'
import { Tab } from './components/Tab'
import { addContact, getState, markConversationRead, sendMessage } from './lib/api'
import type { AppState, Conversation, Message, User } from './types'

type View = 'messages' | 'contacts' | 'add-contact'

const demoUsers: User[] = [
  { id: 'lina', name: 'Lina Yang', initials: 'LY', status: 'Online' },
  { id: 'noah', name: 'Noah Chen', initials: 'NC', status: 'Online' },
]

function upsertMessage(messages: Message[], message: Message) {
  return messages.some((item) => item.id === message.id) ? messages : [...messages, message]
}

function ProfilePicker({ onSelect }: { onSelect: (user: User) => void }) {
  const [selected, setSelected] = useState(demoUsers[0])
  return (
    <main className="profile-picker">
      <div className="profile-picker__brand">MiniChat</div>
      <div className="profile-picker__content">
        <p className="eyebrow">DEMO PROFILE</p>
        <h1>Who are you today?</h1>
        <p>Choose a profile. Open another browser tab with the other profile to test real-time messaging.</p>
        <div className="profile-picker__options" role="radiogroup" aria-label="Demo profile">
          {demoUsers.map((user) => (
            <button
              aria-checked={selected.id === user.id}
              className="profile-option"
              data-selected={selected.id === user.id || undefined}
              key={user.id}
              onClick={() => setSelected(user)}
              role="radio"
            >
              <Avatar user={user} />
              <span>{user.name}</span>
            </button>
          ))}
        </div>
      </div>
      <Button onClick={() => onSelect(selected)}>Continue</Button>
    </main>
  )
}

interface ChatPaneProps {
  contact?: User
  currentUser: User
  messages: Message[]
  onBack?: () => void
  onSend: (text: string) => Promise<void>
}

function ChatPane({ contact, currentUser, messages, onBack, onSend }: ChatPaneProps) {
  if (!contact) {
    return (
      <section className="chat-pane chat-pane--empty">
        <MessageCircle aria-hidden="true" size={30} />
        <h2>Select a conversation</h2>
      </section>
    )
  }

  return (
    <section className="chat-pane">
      <header className="chat-header">
        {onBack && (
          <button className="icon-button chat-header__back" aria-label="Back" title="Back" onClick={onBack}>
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
        )}
        <Avatar user={contact} />
        <div>
          <strong>{contact.name}</strong>
          <span className={`presence presence--${contact.status.toLowerCase()}`}>{contact.status}</span>
        </div>
      </header>
      <div className="message-list" aria-live="polite">
        <span className="date-separator">TODAY</span>
        {messages.map((message) => (
          <MessageBubble currentUserId={currentUser.id} key={message.id} message={message} />
        ))}
      </div>
      <div className="composer-wrap">
        <Composer onSend={onSend} />
      </div>
    </section>
  )
}

function App() {
  const [currentUserId, setCurrentUserId] = useState(() => sessionStorage.getItem('minichat-user') ?? '')
  const [state, setState] = useState<AppState | null>(null)
  const [activeContactId, setActiveContactId] = useState('')
  const [view, setView] = useState<View>('messages')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('minichat-theme') ?? 'light')

  useEffect(() => {
    if (!currentUserId) return
    let active = true
    getState(currentUserId)
      .then((nextState) => {
        if (!active) return
        setState(nextState)
        setActiveContactId((value) => value || (window.matchMedia('(min-width: 900px)').matches ? nextState.contacts[0] || '' : ''))
      })
      .catch((requestError: Error) => setError(requestError.message))

    const socket = io()
    socket.emit('session:join', currentUserId)
    socket.on('message:new', (message: Message) => {
      setState((current) => current && { ...current, messages: upsertMessage(current.messages, message) })
    })
    socket.on('messages:read', ({ userId, contactId }: { userId: string; contactId: string }) => {
      setState((current) => current && {
        ...current,
        messages: current.messages.map((message) => {
          const relevant = message.senderId === contactId && message.recipientId === userId
          return relevant && !message.readBy.includes(userId)
            ? { ...message, readBy: [...message.readBy, userId] }
            : message
        }),
      })
    })
    socket.on('contacts:updated', () => {
      getState(currentUserId).then(setState).catch(() => undefined)
    })
    return () => {
      active = false
      socket.disconnect()
    }
  }, [currentUserId])

  const currentUser = state?.users.find((user) => user.id === currentUserId)

  const conversations = useMemo<Conversation[]>(() => {
    if (!state || !currentUserId) return []
    const result: Conversation[] = []
    for (const contactId of state.contacts) {
      const user = state.users.find((item) => item.id === contactId)
      if (!user) continue
      const conversationMessages = state.messages
        .filter((message) => [message.senderId, message.recipientId].includes(currentUserId) && [message.senderId, message.recipientId].includes(contactId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const unreadCount = conversationMessages.filter((message) => message.recipientId === currentUserId && !message.readBy.includes(currentUserId)).length
      result.push({ user, lastMessage: conversationMessages.at(-1), unreadCount })
    }
    return result.sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''))
  }, [state, currentUserId])

  const activeContact = state?.users.find((user) => user.id === activeContactId)
  const activeMessages = useMemo(() => {
    if (!state || !activeContactId) return []
    return state.messages
      .filter((message) => [message.senderId, message.recipientId].includes(currentUserId) && [message.senderId, message.recipientId].includes(activeContactId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [state, activeContactId, currentUserId])

  const filteredConversations = conversations.filter((conversation) =>
    `${conversation.user.name} ${conversation.lastMessage?.text ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  )
  const contacts = (state?.contacts ?? [])
    .map((id) => state?.users.find((user) => user.id === id))
    .filter((user): user is User => Boolean(user))
    .filter((user) => user.name.toLowerCase().includes(query.toLowerCase()))
  const addableContacts = (state?.users ?? []).filter((user) =>
    user.id !== currentUserId && !state?.contacts.includes(user.id) && user.name.toLowerCase().includes(query.toLowerCase()),
  )

  function chooseProfile(user: User) {
    sessionStorage.setItem('minichat-user', user.id)
    setCurrentUserId(user.id)
  }

  function signOut() {
    sessionStorage.removeItem('minichat-user')
    setCurrentUserId('')
    setState(null)
    setActiveContactId('')
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('minichat-theme', next)
    setTheme(next)
  }

  async function selectConversation(contactId: string) {
    setActiveContactId(contactId)
    setView('messages')
    try {
      await markConversationRead(currentUserId, contactId)
      setState((current) => current && {
        ...current,
        messages: current.messages.map((message) =>
          message.senderId === contactId && message.recipientId === currentUserId && !message.readBy.includes(currentUserId)
            ? { ...message, readBy: [...message.readBy, currentUserId] }
            : message,
        ),
      })
    } catch (requestError) {
      setError((requestError as Error).message)
    }
  }

  async function handleSend(text: string) {
    if (!activeContactId) return
    try {
      const message = await sendMessage(currentUserId, activeContactId, text)
      setState((current) => current && { ...current, messages: upsertMessage(current.messages, message) })
    } catch (requestError) {
      setError((requestError as Error).message)
    }
  }

  async function handleAddContact(contactId: string) {
    try {
      const result = await addContact(currentUserId, contactId)
      setState((current) => current && { ...current, contacts: result.contacts })
      setActiveContactId(contactId)
      setView('contacts')
    } catch (requestError) {
      setError((requestError as Error).message)
    }
  }

  if (!currentUserId) return <ProfilePicker onSelect={chooseProfile} />
  if (!state || !currentUser) return <main className="loading-screen">Loading MiniChat…</main>

  const listContent = view === 'messages' ? (
    <div className="rows-list">
      {filteredConversations.map((conversation) => (
        <ConversationRow
          active={activeContactId === conversation.user.id}
          conversation={conversation}
          key={conversation.user.id}
          onClick={() => selectConversation(conversation.user.id)}
        />
      ))}
    </div>
  ) : (
    <div className="rows-list">
      {(view === 'add-contact' ? addableContacts : contacts).map((user) => (
        <ContactRow
          action={view === 'add-contact' ? 'add' : 'message'}
          key={user.id}
          onAction={() => view === 'add-contact' ? handleAddContact(user.id) : selectConversation(user.id)}
          user={user}
        />
      ))}
      {view === 'add-contact' && addableContacts.length === 0 && <p className="empty-copy">No matching people.</p>}
    </div>
  )

  const listHeader = (
    <>
      <div className="panel-title-row">
        <div>
          {view === 'add-contact' && <p className="eyebrow">DIRECTORY</p>}
          <h1>{view === 'messages' ? 'Messages' : view === 'contacts' ? 'Contacts' : 'Add contact'}</h1>
        </div>
        {view === 'contacts' && (
          <button className="icon-button icon-button--soft" aria-label="Add contact" title="Add contact" onClick={() => { setView('add-contact'); setQuery('') }}>
            <UserPlus aria-hidden="true" size={19} />
          </button>
        )}
      </div>
      {view !== 'add-contact' && (
        <div className="mobile-tabs" role="tablist">
          <Tab active={view === 'messages'} icon={<MessageCircle size={16} />} label="Messages" onClick={() => { setView('messages'); setQuery('') }} />
          <Tab active={view === 'contacts'} icon={<Users size={16} />} label="Contacts" onClick={() => { setView('contacts'); setQuery('') }} />
        </div>
      )}
      <Input
        label={view === 'messages' ? 'Search conversations' : 'Search contacts'}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={view === 'messages' ? 'Search conversations' : 'Search contacts'}
        value={query}
      />
    </>
  )

  return (
    <div className="app" data-theme={theme}>
      {error && <button className="error-banner" onClick={() => setError('')}>{error}</button>}
      <div className="desktop-workspace">
        <nav className="navigation-rail" aria-label="Primary navigation">
          <span className="brand-mark">M</span>
          <button className="rail-button" data-active={view === 'messages' || undefined} aria-label="Messages" title="Messages" onClick={() => setView('messages')}>
            <MessageCircle aria-hidden="true" />
          </button>
          <button className="rail-button" data-active={view !== 'messages' || undefined} aria-label="Contacts" title="Contacts" onClick={() => setView('contacts')}>
            <Users aria-hidden="true" />
          </button>
          <span className="navigation-rail__spacer" />
          <button className="rail-button" aria-label="Toggle theme" title="Toggle theme" onClick={toggleTheme}>
            {theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          </button>
          <button className="rail-button" aria-label="Sign out" title="Sign out" onClick={signOut}>
            <LogOut aria-hidden="true" />
          </button>
          <Avatar user={currentUser} />
        </nav>
        <aside className="list-panel">
          <div className="list-panel__header">{listHeader}</div>
          {listContent}
        </aside>
        <ChatPane contact={activeContact} currentUser={currentUser} messages={activeMessages} onSend={handleSend} />
      </div>

      <div className="mobile-workspace">
        {activeContact && view === 'messages' ? (
          <ChatPane contact={activeContact} currentUser={currentUser} messages={activeMessages} onBack={() => setActiveContactId('')} onSend={handleSend} />
        ) : (
          <main className="mobile-list-screen">
            <header className="mobile-app-header">
              <span className="mobile-brand">MiniChat</span>
              <div className="mobile-user-actions">
                <button className="icon-button" aria-label="Toggle theme" title="Toggle theme" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon aria-hidden="true" size={18} /> : <Sun aria-hidden="true" size={18} />}
                </button>
                <button className="avatar-button" aria-label="Sign out" title="Sign out" onClick={signOut}>
                  <Avatar user={currentUser} />
                </button>
              </div>
            </header>
            {view === 'add-contact' && (
              <button className="mobile-back" onClick={() => setView('contacts')}>
                <ArrowLeft aria-hidden="true" size={18} /> Back
              </button>
            )}
            <div className="mobile-list-content">
              {listHeader}
              {listContent}
            </div>
            {view === 'contacts' && (
              <button className="floating-action" aria-label="Add contact" title="Add contact" onClick={() => setView('add-contact')}>
                <Plus aria-hidden="true" />
              </button>
            )}
          </main>
        )}
      </div>
    </div>
  )
}

export default App
