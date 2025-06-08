export type ChatType = {
  id: string
  name: string
  messages: MessageType[]
}

export type MessageType = {
  id: string
  content: string
  role: 'user' | 'assistant'
}