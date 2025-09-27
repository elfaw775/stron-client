import { ref, computed } from 'vue'
import type { Message } from '@/types/conversation'

interface Card {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'assistant'
}

export function useCardDeck() {
  const cards = ref<Card[]>([])
  
  const userCards = computed(() => 
    cards.value.filter(card => card.sender === 'user')
  )
  
  const addCard = (message: Message) => {
    // 只为用户消息创建扑克牌
    if (message.sender === 'user') {
      const card: Card = {
        id: message.id,
        content: message.content,
        timestamp: message.timestamp,
        sender: message.sender
      }
      cards.value.push(card)
    }
  }
  
  const removeCard = (cardId: string) => {
    const index = cards.value.findIndex(card => card.id === cardId)
    if (index > -1) {
      cards.value.splice(index, 1)
    }
  }
  
  const clearCards = () => {
    cards.value = []
  }
  
  const getCard = (cardId: string) => {
    return cards.value.find(card => card.id === cardId)
  }
  
  // 从对话历史初始化扑克牌
  const initializeFromMessages = (messages: Message[]) => {
    cards.value = messages
      .filter(msg => msg.sender === 'user')
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        sender: msg.sender
      }))
  }
  
  return {
    cards: computed(() => cards.value),
    userCards,
    addCard,
    removeCard,
    clearCards,
    getCard,
    initializeFromMessages
  }
}