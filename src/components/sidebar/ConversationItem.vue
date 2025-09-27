<template>
  <div
    :class="cn(
      'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent',
      isActive && 'bg-accent'
    )"
    @click="$emit('select', conversation.id)"
  >
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium truncate">{{ conversation.title }}</h3>
      <p v-if="conversation.lastMessage" class="text-xs text-muted-foreground truncate mt-1">
        {{ conversation.lastMessage }}
      </p>
      <p class="text-xs text-muted-foreground mt-1">
        {{ formatTime(conversation.updatedAt) }}
      </p>
    </div>
    
    <Button
      v-if="conversations.length > 1"
      @click.stop="$emit('delete', conversation.id)"
      variant="ghost"
      size="icon"
      class="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
    >
      <Trash2 class="h-3 w-3" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/conversation'
import { useConversations } from '@/composables/useConversations'

defineProps<{
  conversation: Conversation
  isActive: boolean
}>()

defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()

const { conversations } = useConversations()

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
</script>