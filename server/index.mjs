import express from 'express'
import { createServer } from 'node:http'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { Server as SocketServer } from 'socket.io'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(rootDir, 'server', 'data.json')
const temporaryDataPath = join(rootDir, 'server', 'data.tmp.json')
const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 5173)

const app = express()
const server = createServer(app)
const io = new SocketServer(server)
app.use(express.json({ limit: '32kb' }))

let mutationQueue = Promise.resolve()

async function readData() {
  return JSON.parse(await readFile(dataPath, 'utf8'))
}

function mutateData(mutator) {
  const operation = mutationQueue.then(async () => {
    const data = await readData()
    const result = mutator(data)
    await writeFile(temporaryDataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await rename(temporaryDataPath, dataPath)
    return result
  })
  mutationQueue = operation.catch(() => undefined)
  return operation
}

function isUser(data, userId) {
  return typeof userId === 'string' && data.users.some((user) => user.id === userId)
}

app.get('/api/state', async (request, response) => {
  const data = await readData()
  const userId = request.query.userId
  if (!isUser(data, userId)) return response.status(400).json({ error: 'Unknown user' })
  response.json({
    users: data.users,
    contacts: data.contacts[userId] ?? [],
    messages: data.messages.filter((message) => message.senderId === userId || message.recipientId === userId),
  })
})

app.post('/api/contacts', async (request, response) => {
  const { userId, contactId } = request.body ?? {}
  try {
    const contacts = await mutateData((data) => {
      if (!isUser(data, userId) || !isUser(data, contactId) || userId === contactId) throw new Error('Invalid contact')
      const list = data.contacts[userId] ?? (data.contacts[userId] = [])
      if (!list.includes(contactId)) list.push(contactId)
      return list
    })
    io.to(userId).emit('contacts:updated')
    response.status(201).json({ contacts })
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

app.post('/api/messages', async (request, response) => {
  const { senderId, recipientId } = request.body ?? {}
  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : ''
  try {
    const message = await mutateData((data) => {
      if (!isUser(data, senderId) || !isUser(data, recipientId) || senderId === recipientId) throw new Error('Invalid conversation')
      if (!text || text.length > 1000) throw new Error('Message must contain 1 to 1000 characters')
      for (const [owner, contact] of [[senderId, recipientId], [recipientId, senderId]]) {
        const list = data.contacts[owner] ?? (data.contacts[owner] = [])
        if (!list.includes(contact)) list.push(contact)
      }
      const created = {
        id: randomUUID(),
        senderId,
        recipientId,
        text,
        createdAt: new Date().toISOString(),
        readBy: [senderId],
      }
      data.messages.push(created)
      return created
    })
    io.to(senderId).to(recipientId).emit('message:new', message)
    response.status(201).json(message)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

app.post('/api/read', async (request, response) => {
  const { userId, contactId } = request.body ?? {}
  try {
    const updated = await mutateData((data) => {
      if (!isUser(data, userId) || !isUser(data, contactId)) throw new Error('Invalid conversation')
      let count = 0
      for (const message of data.messages) {
        if (message.senderId === contactId && message.recipientId === userId && !message.readBy.includes(userId)) {
          message.readBy.push(userId)
          count += 1
        }
      }
      return count
    })
    io.to(userId).to(contactId).emit('messages:read', { userId, contactId })
    response.json({ updated })
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

io.on('connection', (socket) => {
  socket.on('session:join', (userId) => {
    if (typeof userId === 'string') socket.join(userId)
  })
})

if (production) {
  app.use(express.static(join(rootDir, 'dist')))
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api/')) return next()
    response.sendFile(join(rootDir, 'dist', 'index.html'))
  })
} else {
  const { createServer: createViteServer } = await import('vite')
  const vite = await createViteServer({
    root: rootDir,
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server } },
  })
  app.use(vite.middlewares)
}

server.listen(port, () => {
  console.log(`MiniChat running at http://localhost:${port}`)
})
