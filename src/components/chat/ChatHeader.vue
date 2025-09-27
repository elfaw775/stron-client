<template>
  <div class="flex items-center justify-between p-4 border-b border-border">
    <div class="flex items-center space-x-3">
      <!-- Mobile menu button -->
      <Button 
        @click="$emit('toggleSidebar')" 
        variant="ghost" 
        size="icon"
      >
        <Menu class="h-5 w-5" />
      </Button>
      
      <!-- AI Assistant Info -->
      <div class="flex items-center space-x-3">
        <Avatar class="h-8 w-8 lg:h-10 lg:w-10">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div>
          <h2 class="text-lg font-semibold text-foreground">AI Assistant</h2>
          <p class="text-sm text-muted-foreground">Online</p>
        </div>
      </div>
    </div>
    
    <!-- Desktop: No sidebar toggle needed since sidebar is always visible -->
  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-vue-next'

defineEmits<{
  toggleSidebar: []
}>()
</script>