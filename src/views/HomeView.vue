<template>
  <div class="home-container">
    <StarField />
    
    <div class="content-overlay">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="gradient-text">chat to me</span>
          </h1>
          
          <div class="hero-actions">
            <Button 
              @click="startChat" 
              size="lg"
              class="start-chat-btn"
            >
              <MessageCircle class="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import StarField from '@/components/background/StarField.vue'
import { Button } from '@/components/ui/button'
import { MessageCircle, Sparkles, Code, Brain, Zap } from 'lucide-vue-next'

const router = useRouter()

const startChat = () => {
  router.push('/chat')
}
</script>

<style scoped>
.home-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #0a0a0a; /* 备用背景色 */
}

.content-overlay {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  pointer-events: none;
}

.hero-section {
  max-width: 1200px;
  width: 100%;
  text-align: center;
}

.hero-content {
  margin-bottom: 4rem;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.gradient-text {
  color: white;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  to {
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
  }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  pointer-events: auto;
}

.start-chat-btn {
  background: linear-gradient(135deg, #b0b0b0 0%, #545454 100%);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(253, 253, 253, 0.3);
}

.start-chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.5);
}

.learn-more-btn {
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
}

.learn-more-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: white;
  border-radius: 50%;
  margin-bottom: 1.5rem;
  color: black;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-features {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .content-overlay {
    padding: 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>