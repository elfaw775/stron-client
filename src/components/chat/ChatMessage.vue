<template>
  <div class="w-full">
    <!-- Assistant Message -->
    <div v-if="message.sender === 'assistant'" class="flex items-start space-x-4 group">
      <Avatar class="h-8 w-8 mt-1 shrink-0">
        <AvatarFallback class="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0">
        <div class="prose prose-sm max-w-none text-foreground">
          <MarkdownRenderer :content="message.content" />
        </div>
        <div class="flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" @click="copyMessage">
            <Copy class="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs">
            <ThumbsUp class="w-3 h-3 mr-1" />
            Good
          </Button>
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs">
            <ThumbsDown class="w-3 h-3 mr-1" />
            Bad
          </Button>
        </div>
      </div>
    </div>
    
    <!-- User Message -->
    <div v-else class="flex justify-end">
      <div class="max-w-[70%] bg-primary text-primary-foreground rounded-2xl px-4 py-3">
        <div class="text-sm leading-relaxed text-primary-foreground whitespace-pre-wrap">{{ message.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue'
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-vue-next'

interface Message {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'assistant'
}

const props = defineProps<{
  message: Message
}>()

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    console.log('消息已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>