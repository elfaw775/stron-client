<template>
  <div class="p-4">
    <div class="flex items-center space-x-2">
      <div class="flex-1 relative">
        <Input
          v-model="inputMessage"
          :placeholder="isStreaming ? 'AI is responding...' : 'Type a message...'"
          :disabled="isStreaming"
          class="pr-12"
          @keydown.enter="sendMessage"
        />
      </div>
      <Button 
        v-if="!isStreaming"
        @click="sendMessage"
        :disabled="!inputMessage.trim()"
        size="icon"
        class="shrink-0"
      >
        <Send class="h-4 w-4" />
      </Button>
      <Button 
        v-else
        @click="$emit('abortStream')"
        variant="outline"
        size="icon"
        class="shrink-0"
      >
        <Square class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Streaming indicator -->
    <div v-if="isStreaming" class="flex items-center justify-center mt-2">
      <div class="flex items-center space-x-2 text-sm text-muted-foreground">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>
        <span>AI is thinking...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Square } from 'lucide-vue-next'

defineProps<{
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  sendMessage: [content: string]
  abortStream: []
}>()

const inputMessage = ref('')

const sendMessage = () => {
  if (inputMessage.value.trim()) {
    emit('sendMessage', inputMessage.value.trim())
    inputMessage.value = ''
  }
}
</script>