interface MoonshotMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface MoonshotRequest {
    model: string
    messages: MoonshotMessage[]
    temperature?: number
    max_tokens?: number
    stream?: boolean
}

interface MoonshotResponse {
    id: string
    object: string
    created: number
    model: string
    choices: Array<{
        index: number
        message: {
            role: string
            content: string
        }
        finish_reason: string
    }>
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

interface MoonshotStreamChunk {
    id: string
    object: string
    created: number
    model: string
    choices: Array<{
        index: number
        delta: {
            role?: string
            content?: string
        }
        finish_reason?: string
    }>
}

export class MoonshotAPI {
    private apiKey: string
    private baseURL: string = 'https://openai.qiniu.com/v1'

    constructor(apiKey?: string) {
        this.apiKey = apiKey || import.meta.env.VITE_MOONSHOT_API_KEY
        console.log('API Key loaded:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT FOUND')
        console.log('Full API Key for debug:', this.apiKey)
        console.log('Base URL:', this.baseURL)
        if (!this.apiKey) {
            throw new Error('Moonshot API key is required')
        }
    }

    // 测试API连接
    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            })
            console.log('Test connection response:', response.status)
            return response.ok
        } catch (error) {
            console.error('Test connection error:', error)
            return false
        }
    }

    private getHeaders(): Record<string, string> {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        }
        console.log('Request headers:', headers)
        return headers
    }

    // 普通聊天接口
    async chat(messages: MoonshotMessage[], options?: {
        temperature?: number
        maxTokens?: number
    }): Promise<MoonshotResponse> {
        const request: MoonshotRequest = {
            model: 'moonshotai/kimi-k2-0905',
            messages,
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 2000,
            stream: false
        }

        console.log('Sending chat request to:', `${this.baseURL}/chat/completions`)
        console.log('Request JSON:', JSON.stringify(request, null, 2))
        console.log('Headers:', this.getHeaders())

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(request)
        })

        console.log('Chat response status:', response.status)

        if (!response.ok) {
            const error = await response.text()
            console.error('Chat API Error:', error)
            throw new Error(`Moonshot API error: ${response.status} ${error}`)
        }

        return response.json()
    }

    // 流式聊天接口
    async *streamChat(messages: MoonshotMessage[], options?: {
        temperature?: number
        maxTokens?: number
    }): AsyncGenerator<MoonshotStreamChunk, void, unknown> {
        const request: MoonshotRequest = {
            model: 'moonshotai/kimi-k2-0905',
            messages,
            temperature: options?.temperature || 0.7,
            max_tokens: options?.maxTokens || 2000,
            stream: true
        }

        console.log('Sending stream request to:', `${this.baseURL}/chat/completions`)
        console.log('Stream request JSON:', JSON.stringify(request, null, 2))
        console.log('Headers:', this.getHeaders())

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(request)
        })

        console.log('Stream response status:', response.status)

        if (!response.ok) {
            const error = await response.text()
            console.error('Stream API Error:', error)
            throw new Error(`Moonshot API error: ${response.status} ${error}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('Failed to get response reader')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (trimmed === '' || trimmed === 'data: [DONE]') continue

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmed.slice(6)
                            const chunk: MoonshotStreamChunk = JSON.parse(jsonStr)
                            yield chunk
                        } catch (error) {
                            console.warn('Failed to parse chunk:', trimmed, error)
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }
    }
}

// 默认实例
export const moonshotAPI = new MoonshotAPI()