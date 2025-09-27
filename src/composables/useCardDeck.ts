import { ref, computed, toRefs } from 'vue'
import { moonshotAPI } from '@/api/moonshot'

interface Message {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'assistant'
}

interface Card {
  id: string
  content: string
  timestamp: Date
  sender: 'summary'
  messageRange: string // 例如: "消息 1-10"
  originalMessages: Message[] // 保存原始消息用于回复
}

export function useCardDeck() {
  const cards = ref<Card[]>([])
  const messageBuffer = ref<Message[]>([]) // 缓存消息，每10条生成一张卡片
  
  const addMessage = (message: Message) => {
    console.log('添加消息到缓存:', message.content, '当前缓存数量:', messageBuffer.value.length)
    messageBuffer.value.push(message)
    
    console.log('消息添加后缓存数量:', messageBuffer.value.length)
    
    // 每10条消息生成一张总结卡片
    if (messageBuffer.value.length >= 10) {
      console.log('达到10条消息，开始生成总结卡片')
      generateSummaryCard()
    }
  }
  
  const generateSummaryCard = async () => {
    if (messageBuffer.value.length === 0) return
    
    console.log('开始生成总结卡片，消息数量:', messageBuffer.value.length)
    
    try {
      // 构建对话内容用于总结
      const conversationText = messageBuffer.value
        .map((msg: Message) => `${msg.sender === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n')
      
      console.log('准备总结的对话内容:', conversationText)
      
      // 调用AI生成总结
      const summaryResponse = await moonshotAPI.chat([
        {
          role: 'system',
          content: '请为以下对话生成一个简洁的总结，不超过50字，突出主要话题和关键信息。'
        },
        {
          role: 'user',
          content: `请总结以下对话内容：\n\n${conversationText}`
        }
      ])
      
      const summary = summaryResponse.choices[0]?.message?.content || '对话总结生成失败'
      console.log('AI生成的总结:', summary)
      
      // 创建总结卡片
      const startIndex = cards.value.length * 10 + 1
      const endIndex = startIndex + messageBuffer.value.length - 1
      const summaryCard: Card = {
        id: `summary_${Date.now()}`,
        content: summary,
        timestamp: new Date(),
        sender: 'summary',
        messageRange: `消息 ${startIndex}-${endIndex}`,
        originalMessages: [...messageBuffer.value]
      }
      
      cards.value.push(summaryCard)
      console.log('总结卡片已添加，当前卡片数量:', cards.value.length)
      
      // 清空缓存
      messageBuffer.value = []
      
    } catch (error) {
      console.error('生成对话总结失败:', error)
      
      // 如果AI总结失败，创建一个简单的总结
      const fallbackSummary = `包含${messageBuffer.value.length}条消息的对话片段`
      const startIndex = cards.value.length * 10 + 1
      const endIndex = startIndex + messageBuffer.value.length - 1
      const summaryCard: Card = {
        id: `summary_${Date.now()}`,
        content: fallbackSummary,
        timestamp: new Date(),
        sender: 'summary',
        messageRange: `消息 ${startIndex}-${endIndex}`,
        originalMessages: [...messageBuffer.value]
      }
      
      cards.value.push(summaryCard)
      messageBuffer.value = []
      console.log('使用备用总结，卡片已添加')
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
    messageBuffer.value = []
  }
  
  const getCard = (cardId: string) => {
    return cards.value.find(card => card.id === cardId)
  }
  
  // 从对话历史初始化扑克牌
  const initializeFromMessages = async (messages: Message[]) => {
    console.log('初始化消息，总数:', messages.length)
    clearCards()
    
    // 按10条消息分组处理
    for (let i = 0; i < messages.length; i += 10) {
      const messageGroup = messages.slice(i, i + 10)
      
      if (messageGroup.length === 10) {
        // 完整的10条消息，生成AI总结
        messageBuffer.value = messageGroup
        await generateSummaryCard()
      } else if (messageGroup.length > 0) {
        // 不足10条的消息，暂存到缓存中
        messageBuffer.value = messageGroup
      }
    }
    
    console.log('初始化完成，卡片数量:', cards.value.length, '缓存消息数量:', messageBuffer.value.length)
  }
  
  // 手动触发生成当前缓存消息的总结
  const generateCurrentSummary = () => {
    if (messageBuffer.value.length > 0) {
      generateSummaryCard()
    }
  }
  
  return {
    cards,
    messageBuffer,
    addMessage,
    removeCard,
    clearCards,
    getCard,
    initializeFromMessages,
    generateCurrentSummary
  }
}