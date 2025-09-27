import { ref, computed } from 'vue'
import type { Conversation, Message } from '@/types/conversation'

const conversations = ref<Conversation[]>([
  {
    id: '1',
    title: 'Account Login Issue',
    lastMessage: "I can't log in.",
    updatedAt: new Date(Date.now() - 120000),
    messages: [
      {
        id: '1',
        content: 'Hi, how can I help you today?',
        sender: 'assistant',
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: '2',
        content: "Hey, I'm having trouble with my account.",
        sender: 'user',
        timestamp: new Date(Date.now() - 240000)
      },
      {
        id: '3',
        content: 'What seems to be the problem?',
        sender: 'assistant',
        timestamp: new Date(Date.now() - 180000)
      },
      {
        id: '4',
        content: "I can't log in.",
        sender: 'user',
        timestamp: new Date(Date.now() - 120000)
      }
    ]
  },
  {
    id: '2',
    title: 'New Conversation',
    lastMessage: '',
    updatedAt: new Date(),
    messages: []
  }
])

const currentConversationId = ref<string>('1')

export function useConversations() {
  const currentConversation = computed(() => 
    conversations.value.find(c => c.id === currentConversationId.value)
  )

  const sortedConversations = computed(() => 
    [...conversations.value].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  )

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      lastMessage: '',
      updatedAt: new Date(),
      messages: []
    }
    conversations.value.unshift(newConversation)
    currentConversationId.value = newConversation.id
    return newConversation
  }

  const selectConversation = (id: string) => {
    currentConversationId.value = id
  }

  const addMessage = (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      const newMessage: Message = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date()
      }
      conversation.messages.push(newMessage)
      conversation.lastMessage = message.content
      conversation.updatedAt = new Date()
      
      // Update title if it's the first user message
      if (conversation.title === 'New Conversation' && message.sender === 'user') {
        conversation.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      }
    }
  }

  const deleteConversation = (id: string) => {
    const index = conversations.value.findIndex(c => c.id === id)
    if (index > -1) {
      conversations.value.splice(index, 1)
      if (currentConversationId.value === id && conversations.value.length > 0) {
        currentConversationId.value = conversations.value[0].id
      }
    }
  }

  return {
    conversations: sortedConversations,
    currentConversation,
    currentConversationId,
    createNewConversation,
    selectConversation,
    addMessage,
    deleteConversation
  }
}