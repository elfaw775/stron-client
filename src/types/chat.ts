export interface Contact {
  id: string
  name: string
  email: string
  avatar: string
}

export interface Message {
  id: string
  content: string
  sender: 'user' | 'contact'
  timestamp: Date
}