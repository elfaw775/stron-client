export interface SSEMessage {
  id?: string
  event?: string
  data: string
  retry?: number
}

export interface SSEOptions {
  withCredentials?: boolean
  headers?: Record<string, string>
  onOpen?: () => void
  onMessage?: (message: SSEMessage) => void
  onError?: (error: Event) => void
  onClose?: () => void
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private url: string
  private options: SSEOptions

  constructor(url: string, options: SSEOptions = {}) {
    this.url = url
    this.options = options
  }

  connect(): void {
    if (this.eventSource) {
      this.close()
    }

    // 构建URL参数
    const urlWithParams = new URL(this.url)
    
    // 添加认证头等参数到URL（如果需要）
    if (this.options.headers) {
      Object.entries(this.options.headers).forEach(([key, value]) => {
        if (key.toLowerCase() === 'authorization') {
          urlWithParams.searchParams.set('auth', value)
        }
      })
    }

    this.eventSource = new EventSource(urlWithParams.toString(), {
      withCredentials: this.options.withCredentials || false
    })

    this.eventSource.onopen = () => {
      console.log('SSE connection opened')
      this.options.onOpen?.()
    }

    this.eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = {
          data: event.data,
          id: event.lastEventId,
          event: event.type
        }
        this.options.onMessage?.(message)
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      this.options.onError?.(error)
    }

    // 监听自定义事件
    this.eventSource.addEventListener('message', (event) => {
      this.options.onMessage?.({
        data: event.data,
        id: event.lastEventId,
        event: 'message'
      })
    })

    this.eventSource.addEventListener('error', (event) => {
      this.options.onMessage?.({
        data: event.data || 'Stream error',
        event: 'error'
      })
    })

    this.eventSource.addEventListener('done', (event) => {
      this.options.onMessage?.({
        data: event.data || 'Stream completed',
        event: 'done'
      })
      this.close()
    })
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.options.onClose?.()
    }
  }

  get readyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED
  }

  get isConnected(): boolean {
    return this.readyState === EventSource.OPEN
  }
}