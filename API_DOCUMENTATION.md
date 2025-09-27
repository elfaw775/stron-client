# Chat API 接口文档

## 基础信息

- **Base URL**: `/api`
- **认证方式**: Bearer Token (可选)
- **Content-Type**: `application/json`

## 接口列表

### 1. 发送消息 (非流式)

**POST** `/api/chat`

发送消息并获取完整响应。

#### 请求参数

```json
{
  "messages": [
    {
      "role": "user",
      "content": "你好，请介绍一下Vue.js",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "conversationId": "conv_123456",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": false
}
```

#### 响应

```json
{
  "id": "msg_789012",
  "conversationId": "conv_123456",
  "message": {
    "role": "assistant",
    "content": "Vue.js是一个渐进式JavaScript框架...",
    "timestamp": "2024-01-01T00:00:01.000Z"
  },
  "created": "2024-01-01T00:00:01.000Z",
  "model": "gpt-3.5-turbo"
}
```

### 2. 流式聊天

**POST** `/api/chat/stream`

发送消息并通过SSE获取流式响应。

#### 请求参数

```json
{
  "messages": [
    {
      "role": "user", 
      "content": "请详细解释Vue.js的响应式原理",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "conversationId": "conv_123456",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true
}
```

#### SSE 响应格式

响应通过Server-Sent Events (SSE) 流式返回：

**数据块 (data chunk)**
```
event: message
data: {"id":"msg_789012","conversationId":"conv_123456","delta":{"content":"Vue.js"},"created":"2024-01-01T00:00:01.000Z","model":"gpt-3.5-turbo","finished":false}

event: message  
data: {"id":"msg_789012","conversationId":"conv_123456","delta":{"content":"是一个"},"created":"2024-01-01T00:00:01.100Z","model":"gpt-3.5-turbo","finished":false}

event: message
data: {"id":"msg_789012","conversationId":"conv_123456","delta":{"content":"渐进式"},"created":"2024-01-01T00:00:01.200Z","model":"gpt-3.5-turbo","finished":false}
```

**完成标记**
```
event: message
data: {"id":"msg_789012","conversationId":"conv_123456","delta":{},"created":"2024-01-01T00:00:05.000Z","model":"gpt-3.5-turbo","finished":true}

event: done
data: Stream completed
```

**错误处理**
```
event: error
data: {"error":"Rate limit exceeded","code":"RATE_LIMIT"}
```

### 3. 获取对话历史

**GET** `/api/conversations/{conversationId}`

获取指定对话的消息历史。

#### 响应

```json
[
  {
    "role": "user",
    "content": "你好",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  {
    "role": "assistant", 
    "content": "你好！有什么可以帮助你的吗？",
    "timestamp": "2024-01-01T00:00:01.000Z"
  }
]
```

### 4. 创建新对话

**POST** `/api/conversations`

创建一个新的对话会话。

#### 响应

```json
{
  "id": "conv_123456"
}
```

### 5. 删除对话

**DELETE** `/api/conversations/{conversationId}`

删除指定的对话及其所有消息。

#### 响应

```
Status: 204 No Content
```

## 数据模型

### ChatMessage

```typescript
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}
```

### StreamChunk

```typescript
interface StreamChunk {
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
```

## 错误处理

所有API都使用标准HTTP状态码：

- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `429` - 请求频率限制
- `500` - 服务器内部错误

错误响应格式：

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## 认证

如果需要认证，在请求头中包含：

```
Authorization: Bearer your_api_key_here
```

## 限制

- 单次请求最大token数: 4000
- 对话历史最大长度: 100条消息
- 请求频率限制: 60次/分钟
- 最大并发连接数: 10个

## 示例代码

### JavaScript/TypeScript

```typescript
// 流式聊天示例
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_token'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    stream: true
  })
})

const eventSource = new EventSource('/api/chat/stream')
eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data)
  console.log(chunk.delta.content)
}
```

### cURL

```bash
# 普通聊天
curl -X POST /api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'

# 流式聊天
curl -X POST /api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```