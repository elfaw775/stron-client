<template>
  <!-- Mobile Layout -->
  <div class="lg:hidden flex flex-col h-screen bg-background">
    <ChatContainer @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    
    <!-- Mobile Sidebar Overlay -->
    <Sidebar 
      v-if="sidebarOpen"
      :is-open="sidebarOpen" 
      @close="sidebarOpen = false"
    />
  </div>

  <!-- Desktop Layout -->
  <div class="hidden lg:flex h-screen bg-background">
    <!-- Sidebar - Always visible on desktop -->
    <div class="w-80 border-r border-border flex-shrink-0">
      <Sidebar :is-open="true" @close="() => {}" />
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <ChatContainer @toggle-sidebar="() => {}" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/sidebar/Sidebar.vue'
import ChatContainer from '@/components/chat/ChatContainer.vue'

const sidebarOpen = ref(false)
</script>