<template>
  <div class="flex flex-col h-full w-full bg-background ">
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
        <ChatInput @send-message="handleSendMessage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatHeader from './ChatHeader.vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import { MessageCircle } from 'lucide-vue-next'
import { useConversations } from '@/composables/useConversations'

defineEmits<{
  toggleSidebar: []
}>()

const { currentConversation, currentConversationId, addMessage } = useConversations()

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

const handleSendMessage = (content: string) => {
  if (currentConversationId.value) {
    addMessage(currentConversationId.value, {
      content,
      sender: 'user'
    })
    
    // Simulate assistant response
    setTimeout(() => {
      if (currentConversationId.value) {
        addMessage(currentConversationId.value, {
          content: 'I understand your question. Let me help you with that. This is a detailed response that shows how the assistant would typically respond to user queries with helpful and informative content.',
          sender: 'assistant'
        })
      }
    }, 1000)
  }
}

const handleSuggestionClick = (prompt: string) => {
  handleSendMessage(prompt)
}
</script>