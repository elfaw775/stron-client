// 测试Moonshot API的数据格式
export const testMoonshotRequest = () => {
  const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY
  
  const requestData = {
    model: "moonshotai/kimi-k2-0905",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "Hello!"
      }
    ],
    stream: false
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  console.log('=== Moonshot API 测试数据 ===')
  console.log('URL:', 'https://openai.qiniu.com/v1/chat/completions')
  console.log('Method:', 'POST')
  console.log('Headers:', JSON.stringify(headers, null, 2))
  console.log('Body:', JSON.stringify(requestData, null, 2))
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND')
  
  return { requestData, headers }
}

// 手动测试函数
export const manualTest = async () => {
  const { requestData, headers } = testMoonshotRequest()
  
  try {
    const response = await fetch('https://openai.qiniu.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return { success: false, error: errorText }
    }
    
    const result = await response.json()
    console.log('Success response:', result)
    return { success: true, data: result }
    
  } catch (error) {
    console.error('Request failed:', error)
    return { success: false, error: error.message }
  }
}