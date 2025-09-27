<template>
  <div class="p-4 border rounded-lg">
    <h3 class="text-lg font-semibold mb-4">Moonshot API 测试</h3>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">测试消息:</label>
        <input 
          v-model="testMessage" 
          type="text" 
          class="w-full p-2 border rounded"
          placeholder="输入测试消息..."
        />
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="testAPI" 
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ isLoading ? '测试中...' : '测试API' }}
        </button>
        
        <button 
          @click="manualTestAPI" 
          :disabled="isLoading"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          手动测试
        </button>
        
        <button 
          @click="showRequestFormat" 
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          显示请求格式
        </button>
      </div>
      
      <div v-if="response" class="mt-4 p-3 bg-gray-100 rounded">
        <h4 class="font-medium mb-2">响应:</h4>
        <p class="text-sm">{{ response }}</p>
      </div>
      
      <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded">
        <h4 class="font-medium mb-2">错误:</h4>
        <p class="text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { moonshotAPI } from '@/api/moonshot'
import { testMoonshotRequest, manualTest } from '@/utils/testMoonshot'

const testMessage = ref('你好，请介绍一下你自己')
const isLoading = ref(false)
const response = ref('')
const error = ref('')

const testAPI = async () => {
  if (!testMessage.value.trim()) return
  
  isLoading.value = true
  response.value = ''
  error.value = ''
  
  try {
    // 先测试连接
    console.log('Testing API connection...')
    const connectionTest = await moonshotAPI.testConnection()
    console.log('Connection test result:', connectionTest)
    
    const result = await moonshotAPI.chat([
      {
        role: 'system',
        content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手。'
      },
      {
        role: 'user',
        content: testMessage.value
      }
    ])
    
    response.value = result.choices[0]?.message?.content || '无响应'
  } catch (err) {
    error.value = err instanceof Error ? err.message : '未知错误'
    console.error('API Test Error:', err)
  } finally {
    isLoading.value = false
  }
}

const manualTestAPI = async () => {
  isLoading.value = true
  response.value = ''
  error.value = ''
  
  try {
    const result = await manualTest()
    if (result.success) {
      response.value = result.data.choices[0]?.message?.content || '无响应'
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '未知错误'
  } finally {
    isLoading.value = false
  }
}

const showRequestFormat = () => {
  testMoonshotRequest()
}
</script>