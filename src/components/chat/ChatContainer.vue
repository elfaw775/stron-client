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
</script>