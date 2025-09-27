<template>
  <div class="p-4 border-t border-border">
    <div class="flex items-center space-x-2">
      <div class="flex-1 relative">
        <Input
          v-model="inputMessage"
          placeholder="Type a message..."
          class="pr-12"
          @keydown.enter="sendMessage"
        />
      </div>
      <Button 
        @click="sendMessage"
        :disabled="!inputMessage.trim()"
        size="icon"
        class="shrink-0"
      >
        <Send class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-vue-next'

const emit = defineEmits<{
  sendMessage: [content: string]
}>()

const inputMessage = ref('')

const sendMessage = () => {
  if (inputMessage.value.trim()) {
    emit('sendMessage', inputMessage.value.trim())
    inputMessage.value = ''
  }
}
</script>