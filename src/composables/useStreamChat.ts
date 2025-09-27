import { ref, computed } from 'vue'
import { chatAPI, type ChatRequest, type StreamChunk } from '@/api/chat'
import { SSEClient } from '@/utils/sse'
import { useConversations } from './useConversations'
import type { Message } from '@/types/conversation'

export function useStreamChat() {
  const { currentConversationId, addMessage, updateLastMessage } = useConversations()
  
  const isStreaming = ref(false)
  const streamingMessageId = ref<string | null>(null)
  const currentStreamContent = ref('')
  const sseClient = ref<SSEClient | null>(null)

  const canSendMessage = computed(() => !isStreaming.value)

  const sendStreamMessage = async (content: string) => {
    if (!currentConversationId.value || isStreaming.value) {
      return
    }

    // 添加用户消息
    addMessage(currentConversationId.value, {
      content,
      sender: 'user'
    })

    // 获取当前对话的所有消息作为上下文
    const { currentConversation } = useConversations()
    const contextMessages = currentConversation.value?.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    })) || []

    // 准备请求数据
    const request: ChatRequest = {
      messages: [
        ...contextMessages,
        {
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }
      ],
      conversationId: currentConversationId.value,
      stream: true,
      temperature: 0.7,
      maxTokens: 2000
    }

    isStreaming.value = true
    currentStreamContent.value = ''
    
    // 添加一个空的助手消息作为占位符
    const assistantMessageId = Date.now().toString()
    streamingMessageId.value = assistantMessageId
    
    addMessage(currentConversationId.value, {
      content: '',
      sender: 'assistant'
    })

    try {
      sseClient.value = chatAPI.streamMessage(
        request,
        handleStreamChunk,
        handleStreamError,
        handleStreamComplete
      )
    } catch (error) {
      handleStreamError(error as Error)
    }
  }

  const handleStreamChunk = (chunk: StreamChunk) => {
    if (chunk.delta.content) {
      currentStreamContent.value += chunk.delta.content
      
      // 更新当前对话中的最后一条消息
      if (currentConversationId.value && streamingMessageId.value) {
        updateLastMessage(currentConversationId.value, currentStreamContent.value)
      }
    }

    if (chunk.finished) {
      handleStreamComplete()
    }
  }

  const handleStreamError = (error: Error) => {
    console.error('Stream error:', error)
    
    // 更新消息显示错误
    if (currentConversationId.value && streamingMessageId.value) {
      updateLastMessage(
        currentConversationId.value, 
        currentStreamContent.value || 'Sorry, there was an error processing your request.'
      )
    }
    
    stopStreaming()
  }

  const handleStreamComplete = () => {
    console.log('Stream completed')
    stopStreaming()
  }

  const stopStreaming = () => {
    isStreaming.value = false
    streamingMessageId.value = null
    currentStreamContent.value = ''
    
    if (sseClient.value) {
      sseClient.value.close()
      sseClient.value = null
    }
  }

  const abortStream = () => {
    if (sseClient.value) {
      sseClient.value.close()
    }
    stopStreaming()
  }

  return {
    isStreaming: computed(() => isStreaming.value),
    canSendMessage,
    currentStreamContent: computed(() => currentStreamContent.value),
    sendStreamMessage,
    abortStream
  }
}