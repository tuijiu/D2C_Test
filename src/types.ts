export type UserStatus = 'Online' | 'Away' | 'Offline'

export interface User {
  id: string
  name: string
  initials: string
  status: UserStatus
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  text: string
  createdAt: string
  readBy: string[]
}

export interface AppState {
  users: User[]
  contacts: string[]
  messages: Message[]
}

export interface Conversation {
  user: User
  lastMessage?: Message
  unreadCount: number
}
