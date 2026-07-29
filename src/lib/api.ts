import type { AppState, Message } from '../types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(payload.error ?? 'Request failed')
  }
  return response.json() as Promise<T>
}

export function getState(userId: string) {
  return request<AppState>(`/api/state?userId=${encodeURIComponent(userId)}`)
}

export function addContact(userId: string, contactId: string) {
  return request<{ contacts: string[] }>('/api/contacts', {
    method: 'POST',
    body: JSON.stringify({ userId, contactId }),
  })
}

export function sendMessage(senderId: string, recipientId: string, text: string) {
  return request<Message>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ senderId, recipientId, text }),
  })
}

export function markConversationRead(userId: string, contactId: string) {
  return request<{ updated: number }>('/api/read', {
    method: 'POST',
    body: JSON.stringify({ userId, contactId }),
  })
}
