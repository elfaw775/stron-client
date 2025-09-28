<template>
  <div class="flex flex-col h-full w-full bg-background">
    <!-- Chat Header -->
    <ChatHeader @toggle-sidebar="$emit('toggleSidebar')" />
    
    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto w-full">
      <div v-if="currentConversation?.messages.length" class="w-full h-full">
        <div class="max-w-3xl lg:max-w-none mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 py-6 space-y-6 w-full">
          <ChatMessage
            v-for="message in currentConversation.messages"
            :key="message.id"
            :message="message"
          />
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full w-full">
        <div class="text-center text-muted-foreground max-w-md lg:max-w-2xl xl:max-w-4xl px-4">
          <div class="mb-8">
            <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-2 text-foreground">Start a new conversation</h3>
            <p class="text-sm text-muted-foreground">Ask me anything or choose from the suggestions below</p>
          </div>
          
          <!-- Suggestion Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8 w-full">
            <div 
              v-for="suggestion in suggestions"
              :key="suggestion.title"
              @click="handleSuggestionClick(suggestion.prompt)"
              class="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left"
            >
              <h4 class="font-medium text-sm mb-1 text-foreground">{{ suggestion.title }}</h4>
              <p class="text-xs text-muted-foreground">{{ suggestion.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="border-t border-border bg-background w-full">
      <div class="max-w-3xl lg:max-w-none mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 py-4 w-full">
        <ChatInput 
          ref="chatInputRef"
          :is-streaming="isStreaming"
          @send-message="handleSendMessage" 
          @abort-stream="abortStream"
        />
      </div>
    </div>
    
    <!-- 扑克牌组件作为聊天footer -->
    <CardDeck 
      :cards="cards"
      @reply-to-card="handleReplyToCard"
      @copy-card="handleCopyCard"
      @drag-to-input="handleDragToInput"
      @summarize-cards="handleSummarizeCards"
    />
    
   
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ChatHeader from './ChatHeader.vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import CardDeck from '@/components/cards/CardDeck.vue'
import { MessageCircle } from 'lucide-vue-next'
import { useConversations } from '@/composables/useConversations'
import { useStreamChat } from '@/composables/useStreamChat'
import { useCardDeck } from '@/composables/useCardDeck'

defineEmits<{
  toggleSidebar: []
}>()

const { currentConversation, currentConversationId } = useConversations()
const { isStreaming, canSendMessage, sendStreamMessage, abortStream } = useStreamChat()
const { cards, addMessage, initializeFromMessages, generateCurrentSummary, messageBuffer } = useCardDeck()

const chatInputRef = ref<InstanceType<typeof ChatInput>>()

const isDev = true // 开发模式

// 监听当前对话变化，初始化扑克牌
watch(currentConversation, async (newConversation) => {
  if (newConversation) {
    await initializeFromMessages(newConversation.messages)
  }
}, { immediate: true })

// 监听消息变化，添加新消息到缓存
let lastMessageCount = 0

watch(() => currentConversation.value?.messages, (newMessages) => {
  console.log('消息变化检测:', {
    newLength: newMessages?.length,
    lastCount: lastMessageCount,
    hasNew: newMessages && newMessages.length > lastMessageCount
  })
  
  if (newMessages && newMessages.length > lastMessageCount) {
    console.log("检测到新消息")
    // 处理所有新增的消息
    for (let i = lastMessageCount; i < newMessages.length; i++) {
      const newMessage = newMessages[i]
      console.log('新消息内容:', newMessage)
      addMessage(newMessage)
    }
    lastMessageCount = newMessages.length
  } else if (newMessages) {
    // 更新计数器，但不处理消息（可能是初始化）
    lastMessageCount = newMessages.length
  }
}, { deep: true, immediate: true })       

const suggestions = ref([
  {
    title: "解释代码概念",
    description: "帮我解释一个编程概念",
    prompt: "请解释什么是Vue.js的响应式系统"
  },
  {
    title: "代码调试帮助",
    description: "帮我找出代码中的问题",
    prompt: "我的代码有bug，能帮我看看吗？"
  },
  {
    title: "项目架构建议",
    description: "获取项目结构的建议",
    prompt: "如何设计一个Vue3项目的文件结构？"
  },
  {
    title: "最佳实践指导",
    description: "学习编程最佳实践",
    prompt: "Vue3开发有哪些最佳实践？"
  }
])

const handleSendMessage = async (content: string) => {
  if (!canSendMessage.value || !currentConversationId.value) {
    return
  }

  try {
    await sendStreamMessage(content)
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

const handleSuggestionClick = (prompt: string) => {
  handleSendMessage(prompt)
}

// 处理卡片回复 - 点击卡片将内容添加到对话中
const handleReplyToCard = (card: any) => {
  if (!currentConversationId.value) return
  
  // 构建回复内容，基于总结卡片
  const replyContent = `请基于以下对话总结进行详细说明：\n"${card.content}"\n\n请展开解释相关内容。`
  
  // 直接发送消息

  handleSendMessage(replyContent)
}

// 处理卡片复制
const handleCopyCard = (content: string) => {
  console.log('Copied:', content)
  // 可以显示复制成功的提示
  // 这里可以添加toast通知
}

// 处理卡片拖拽到输入框
const handleDragToInput = (content: string) => {
  console.log('Dragged to input:', content)
  // 调用ChatInput组件的方法将内容添加到输入框
  chatInputRef.value?.handleDragToInput(content)
}

// 处理多卡片AI总结
const handleSummarizeCards = async (cards: any[]) => {
  if (cards.length === 0) {
    return
  }

  console.log('Summarizing cards:', cards)
  
  try {
    // 构建总结提示
    const cardContents = cards.map((card, index) => 
      `卡片${index + 1}: ${card.content}`
    ).join('\n\n')
    
    const summaryPrompt = `角色与目标：
你是一位专业的知识联想与拓展教练。你的核心任务是接收一份简洁的知识卡片内容，并基于此内容，进行深度和广度的联想，生成一个既相关又极具启发性的新问题，以引导用户进行下一步的深入学习。

输入格式：
你将接收到一个纯文本形式的知识卡片。请将输入视为包含标题、核心内容和关键词的知识块。

处理流程与要求：

解析核心概念： 深入理解输入的知识卡片内容，明确其核心概念、功能或原理。

发散联想角度： 基于核心概念，进行合理的知识发散。联想方向应聚焦于：

下一步学习： 学习完卡片内容后，最应该探索的关联或进阶知识。

实际应用/限制： 该知识点在实际工作或场景中的应用方式、优缺点或限制条件。

底层机制/对比： 支撑该知识的底层原理，或与相似概念的关键区别。

构建输出文本：

引导语（Context）： 围绕卡片内容，生成1句简洁的过渡语。这句引导语必须逻辑严密，清楚地表明为什么会引出这个新问题。

新问题（Question）： 生成一个清晰、富有启发性的拓展问题。问题应具有足够的深度，能促使学习者探索未知领域。

输出格式规范：
你的输出必须严格遵循以下纯文本结构。在每个主要部分之间必须插入一个空行（即连续两个换行符），以确保前端渲染时，引导语和新问题相互独立，清晰分段。禁止包含任何多余的解释、说明性文字或前缀。

格式模板：

[基于原卡片内容的 1 句引导语，用于引出新问题。]

[联想和发散后生成的新问题。]
示例（如果输入卡片是关于“初学者如何在冰上站立和平衡”）：

掌握了基础的站姿和平衡技巧后，下一步就是学习如何在冰上移动和控制方向。

在保持平衡的同时，如何通过身体重心的移动来控制滑行方向和速度？
请基于以下${cards.length}张对话总结卡片的内容，生成一个简洁的综合总结（不超过200字），整合这些要点：

${cardContents}

请直接返回总结内容，不需要额外的解释或格式。`

    // 调用AI API获取总结
    const summary = await getSummaryFromAI(summaryPrompt)
    
    // 将总结结果添加到输入框
    if (summary && chatInputRef.value) {
      chatInputRef.value.handleDragToInput(summary)
    }
    
  } catch (error) {
    console.error('Failed to summarize cards:', error)
    // 如果AI总结失败，直接将卡片内容合并到输入框
    const fallbackContent = cards.map(card => card.content).join('\n\n')
    chatInputRef.value?.handleDragToInput(`基于以下内容的讨论：\n\n${fallbackContent}`)
  }
}

// 调用AI获取总结的函数
const getSummaryFromAI = async (prompt: string): Promise<string> => {
  const { moonshotAPI } = await import('@/api/moonshot')
  
  const messages = [
    {
      role: 'system' as const,
      content: '你是一个专业的内容总结助手，能够将多个要点整合成简洁清晰的总结。'
    },
    {
      role: 'user' as const,
      content: prompt
    }
  ]

  const response = await moonshotAPI.chat(messages, {
    temperature: 0.7,
    maxTokens: 300
  })

  return response.choices[0]?.message?.content || ''
}
</script>