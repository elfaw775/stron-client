<template>
  <div class="p-4 chat-input-area">
    <div class="flex items-end space-x-2">
      <div class="flex-1 relative">
        <Textarea
          ref="textareaRef"
          v-model="inputMessage"
          :placeholder="isStreaming ? 'AI is responding...' : 'Type a message... (Shift+Enter for new line, Enter to send)'"
          :disabled="isStreaming"
          class="min-h-[60px] max-h-[200px] resize-none"
          @keydown="handleKeydown"
        />
      </div>
      <Button 
        v-if="!isStreaming"
        @click="sendMessage"
        :disabled="!inputMessage.trim()"
        size="icon"
        class="shrink-0 mb-1"
      >
        <Send class="h-4 w-4" color="black" />
      </Button>
      <Button 
        v-else
        @click="$emit('abortStream')"
        variant="outline"
        size="icon"
        class="shrink-0 mb-1"
      >
        <Square class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square } from 'lucide-vue-next'

defineProps<{
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  sendMessage: [content: string]
  abortStream: []
}>()

const inputMessage = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const showDragHint = ref(false)

const handleKeydown = (event: KeyboardEvent) => {
  // Enter 发送消息 (不按Shift)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
    return
  }
  
  // Shift+Enter 换行 (默认行为，不需要特殊处理)
}

const sendMessage = () => {
  if (inputMessage.value.trim()) {
    emit('sendMessage', inputMessage.value.trim())
    inputMessage.value = ''
  }
}

// 处理拖拽到输入框的内容
const handleDragToInput = (content: string) => {
  console.log('ChatInput received drag content:', content)
  
  // 如果输入框已有内容，在末尾添加
  if (inputMessage.value.trim()) {
    inputMessage.value += '\n\n' + content
  } else {
    inputMessage.value = content
  }
  
  // 移除拖拽提示
  showDragHint.value = false
  
  // 移除拖拽区域的视觉反馈
  const inputArea = document.querySelector('.chat-input-area')
  if (inputArea) {
    inputArea.classList.remove('drag-over')
  }
  
  // 聚焦到输入框
  setTimeout(() => {
    textareaRef.value?.focus()
  }, 100)
}

// 这些函数暂时保留，可能在后续版本中使用
// const handleDragOver = () => {
//   showDragHint.value = true
// }

// const handleDragLeave = () => {
//   showDragHint.value = false
// }

onMounted(() => {
  // 监听拖拽相关的CSS类变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as Element
        if (target.classList.contains('drag-over')) {
          showDragHint.value = true
        } else if (!document.querySelector('.drag-over')) {
          showDragHint.value = false
        }
      }
    })
  })
  
  // 观察输入区域的类变化
  const inputArea = document.querySelector('.chat-input-area')
  if (inputArea) {
    observer.observe(inputArea, { attributes: true, attributeFilter: ['class'] })
  }
  
  // 清理函数
  onUnmounted(() => {
    observer.disconnect()
  })
})

// 暴露方法给父组件
defineExpose({
  handleDragToInput
})
</script>

<style scoped>
.chat-input-area {
  position: relative;
  transition: all 0.3s ease;
}

/* 拖拽悬停状态 */
:global(.chat-input-area.drag-over) {
  background: linear-gradient(135deg, rgba(156, 218, 204, 0.1), rgba(147, 201, 209, 0.1));
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(156, 218, 204, 0.3);
}

:global(.chat-input-area.drag-over textarea) {
  border-color: #9cdacc !important;
  box-shadow: 0 0 0 2px rgba(156, 218, 204, 0.2) !important;
}

/* 拖拽提示 */
.drag-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  pointer-events: none;
  z-index: 1000;
  animation: dragHintAppear 0.3s ease-out;
}

.drag-hint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.drag-hint-icon {
  font-size: 24px;
  animation: bounce 1s infinite;
}

.drag-hint-text {
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
}

@keyframes dragHintAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .drag-hint-text {
    font-size: 12px;
  }
  
  .drag-hint-icon {
    font-size: 20px;
  }
}
</style>