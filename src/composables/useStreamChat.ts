import { ref, computed } from 'vue'
import { moonshotAPI, type MoonshotMessage } from '@/api/moonshot'
import { useConversations } from './useConversations'

export function useStreamChat() {
  const { currentConversationId, addMessage, updateLastMessage, currentConversation } = useConversations()

  const isStreaming = ref(false)
  const streamingMessageId = ref<string | null>(null)
  const currentStreamContent = ref('')
  const abortController = ref<AbortController | null>(null)

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

    // 准备消息历史
    const messages: MoonshotMessage[] = []

    // 添加系统提示
    messages.push({
      role: 'system',
      content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。'
    })

    // 添加对话历史（除了刚刚添加的用户消息）
    if (currentConversation.value?.messages) {
      const historyMessages = currentConversation.value.messages.slice(0, -1) // 排除刚添加的消息
      for (const msg of historyMessages) {
        if (msg.sender === 'user') {
          messages.push({
            role: 'user',
            content: msg.content
          })
        } else if (msg.sender === 'assistant') {
          messages.push({
            role: 'assistant',
            content: msg.content
          })
        }
      }
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content
    })

    isStreaming.value = true
    currentStreamContent.value = ''
    
    // 创建新的AbortController
    abortController.value = new AbortController()

    // 添加一个空的助手消息作为占位符
    const assistantMessageId = Date.now().toString()
    streamingMessageId.value = assistantMessageId

    addMessage(currentConversationId.value, {
      content: '',
      sender: 'assistant'
    })

    try {
      // 使用Moonshot API进行流式对话，传入abort信号
      const stream = moonshotAPI.streamChat(messages, {
        temperature: 0.7,
        maxTokens: 2000,
        signal: abortController.value.signal
      })

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]?.delta?.content) {
          currentStreamContent.value += chunk.choices[0].delta.content

          // 更新当前对话中的最后一条消息
          if (currentConversationId.value) {
            updateLastMessage(currentConversationId.value, currentStreamContent.value)
          }
        }

        // 检查是否完成
        if (chunk.choices && chunk.choices[0]?.finish_reason) {
          handleStreamComplete()
          break
        }
      }
    } catch (error) {
      handleStreamError(error as Error)
    }
  }

  const handleStreamError = (error: Error) => {
    if (error.name === 'AbortError') {
      console.log('Stream aborted by user',currentStreamContent.value)
      // 如果是用户主动中止，显示中止消息
      // if (currentConversationId.value) {
      //   updateLastMessage(
      //     currentConversationId.value,
      //     currentStreamContent.value || ''
      //   )
      // }
    } else {
      console.error('Stream error:', error)
      // 更新消息显示错误
      if (currentConversationId.value) {
        const errorMessage = error.message.includes('API key')
          ? 'API密钥配置错误，请检查环境变量配置'
          : `抱歉，处理您的请求时出现错误: ${error.message}`

        updateLastMessage(
          currentConversationId.value,
          currentStreamContent.value || errorMessage
        )
      }
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
    abortController.value = null
  }

  const abortStream = () => {
    console.log('Aborting stream...')
    
    // 如果有正在进行的请求，中止它
    if (abortController.value) {
      abortController.value.abort()
    }
    
    // 立即停止流状态
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