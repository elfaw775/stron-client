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
    //console.log('添加消息到缓存:', message.content, '当前缓存数量:', messageBuffer.value.length)
    messageBuffer.value.push(message)
    
    //console.log('消息添加后缓存数量:', messageBuffer.value.length)
    
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
      
     // console.log('准备总结的对话内容:', conversationText)
      
      // 调用AI生成总结
      const summaryResponse = await moonshotAPI.chat([
        {
          role: 'system',
          content: `角色与目标：
你是一个专业的知识提取助手，你的唯一目标是分析当前的对话上下文，识别出一个核心的知识点或关键问题，并将其提炼成一个简洁、自洽的知识卡片内容。

处理流程与要求：

分析对话上下文： 仔细阅读用户和我（模型）在对话中的交流。特别注意最近几轮的对话内容，优先选择当前正在讨论的或用户最新提出的关键问题、概念或讨论重点进行提取，避免重复提取上文已总结过的内容。

确定核心焦点： 仅选择一个最突出、最具学习价值的关键问题、概念或讨论重点。

提取与提炼：

标题： 将核心焦点转化为一个简洁明了的问题或一个清晰的概念名称（不超过 12 个字）。

核心内容： 提供对这个标题的直接、准确、简短的解释或回答。内容必须控制在两句话之内，确保内容精炼且自洽，可以直接学习。

关键词： 提取 2-3 个最相关的关键词，用逗号分隔。

输出格式规范：
你的输出必须严格遵循以下纯文本结构。在每个主要部分之间必须插入一个空行（即连续两个换行符），以确保前端渲染时标题、核心内容和关键词三者相互独立，清晰分段。禁止包含任何多余的解释、说明性文字或前缀。

格式模板：

[知识卡片标题，例如：滑冰前的热身步骤]

[核心内容的解释或答案，控制在两句话之内。]

[关键词1,关键词2,关键词3]
示例（滑冰场景参考）：
如果对话讨论了初学者如何在冰上保持平衡。

初学者如何在冰上站立和平衡

初学者应采用内八字站姿，即脚尖略微向内靠拢，膝盖保持微曲，重心放在冰刀的中后部。

滑冰,平衡,初学`
        },
        {
          role: 'user',
          content: `请总结以下对话内容：\n\n${conversationText}`
        }
      ])
      
      const summary = summaryResponse.choices[0]?.message?.content || '对话总结生成失败'
      //console.log('AI生成的总结:', summary)
      
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
     // console.log('总结卡片已添加，当前卡片数量:', cards.value.length)
      
      // 清空缓存
      messageBuffer.value = []
      
    } catch (error) {
      //console.error('生成对话总结失败:', error)
      
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
   // console.log('初始化消息，总数:', messages.length)
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