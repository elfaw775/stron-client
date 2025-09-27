<template>
  <div 
    :class="cn(
      'w-80 bg-background flex flex-col h-full',
      // Mobile styles
      'lg:relative lg:translate-x-0',
      // Mobile overlay positioning
      !isDesktop && 'fixed inset-y-0 left-0 z-50 border-r border-border transform transition-transform duration-300 ease-in-out',
      !isDesktop && (isOpen ? 'translate-x-0' : '-translate-x-full')
    )"
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <h2 class="text-lg font-semibold">Conversations</h2>
      <div class="flex items-center space-x-2">
        <Button @click="createNew" variant="ghost" size="icon">
          <Plus class="h-4 w-4" />
        </Button>
        <Button 
          v-if="!isDesktop"
          @click="$emit('close')" 
          variant="ghost" 
          size="icon"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto p-2">
      <ConversationItem
        v-for="conversation in conversations"
        :key="conversation.id"
        :conversation="conversation"
        :is-active="conversation.id === currentConversationId"
        @select="selectConversation"
        @delete="deleteConversation"
      />
    </div>
  </div>

  <!-- Overlay for mobile -->
  <div
    v-if="isOpen && !isDesktop"
    class="fixed inset-0 bg-black/50 z-40"
    @click="$emit('close')"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import ConversationItem from './ConversationItem.vue'
import { Plus, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { useConversations } from '@/composables/useConversations'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

const {
  conversations,
  currentConversationId,
  createNewConversation,
  selectConversation,
  deleteConversation
} = useConversations()

const windowWidth = ref(window.innerWidth)

const isDesktop = computed(() => windowWidth.value >= 1024)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const createNew = () => {
  createNewConversation()
}
</script>