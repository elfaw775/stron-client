<template>
  <div id="app" class="h-screen">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
#app {
  margin: 0;
  padding: 0;
  text-align: left;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
</style>
