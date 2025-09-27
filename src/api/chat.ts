import { SSEClient, type SSEMessage } from '@/utils/sse'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  conversationId?: string
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatResponse {
  id: string
  conversationId: string
  message: ChatMessage
  created: string
  model: string
}

export interface StreamChunk {
  id: string
  conversationId: string
  delta: {
    content?: string
    role?: string
  }
  created: string
  model: string
  finished: boolean
}

export class ChatAPI {
  private baseURL: string
  private apiKey?: string

  constructor(baseURL: string = '/api', apiKey?: string) {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }
    
    return headers
  }

  // 普通聊天接口（非流式）
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...request, stream: false })
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 流式聊天接口
  streamMessage(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): SSEClient {
    const url = `${this.baseURL}/chat/stream`
    
    const sseClient = new SSEClient(url, {
      headers: this.getHeaders(),
      onMessage: (message: SSEMessage) => {
        try {
          if (message.event === 'error') {
            onError?.(new Error(message.data))
            return
          }

          if (message.event === 'done') {
            onComplete?.()
            return
          }

          const chunk: StreamChunk = JSON.parse(message.data)
          onChunk(chunk)
        } catch (error) {
          console.error('Error parsing stream chunk:', error)
          onError?.(error as Error)
        }
      },
      onError: (error) => {
        onError?.(new Error('SSE connection error'))
      },
      onClose: () => {
        onComplete?.()
      }
    })

    // 发送初始请求数据
    this.initializeStream(request).then(() => {
      sseClient.connect()
    }).catch(onError)

    return sseClient
  }

  private async initializeStream(request: ChatRequest): Promise<void> {
    const response = await fetch(`${this.baseURL}/chat/stream`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...request, stream: true })
    })

    if (!response.ok) {
      throw new Error(`Stream initialization error: ${response.status} ${response.statusText}`)
    }
  }

  // 获取对话历史
  async getConversation(conversationId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseURL}/conversations/${conversationId}`, {
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Get conversation error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 创建新对话
  async createConversation(): Promise<{ id: string }> {
    const response = await fetch(`${this.baseURL}/conversations`, {
      method: 'POST',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Create conversation error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 删除对话
  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Delete conversation error: ${response.status} ${response.statusText}`)
    }
  }
}

// 默认实例
export const chatAPI = new ChatAPI()