<template>
  <div 
    :class="cardClasses"
    :style="cardStyle"
    @click="handleCardClick"
    @dblclick="handleCardDoubleClick"                                                                                    
  >
    <div class="card-content">
      <div class="card-header">
        <span class="card-number">{{ cardNumber }}</span>
        <span class="card-type">📝</span>
      </div>
      <div class="card-body">
        <p class="card-text">{{ truncatedContent }}</p>
        <p v-if="card.messageRange" class="card-range">{{ card.messageRange }}</p>
      </div>
      <div class="card-footer">
        <span class="card-time">{{ formatTime(card.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Card {
  id: string
  content: string
  timestamp: Date
  sender: 'summary'
  messageRange?: string
  originalMessages?: any[]
}

const props = defineProps<{
  card: Card
  index: number
  totalCards: number
  isSelected: boolean
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  reply: [card: Card]
}>()

const cardNumber = computed(() => props.index + 1)

const truncatedContent = computed(() => {
  const maxLength = props.isCollapsed ? 20 : 40
  return props.card.content.length > maxLength 
    ? props.card.content.slice(0, maxLength) + '...'
    : props.card.content
})

const cardClasses = computed(() => [
  'playing-card',
  {
    'selected': props.isSelected,
    'collapsed': props.isCollapsed,
    'summary-card': props.card.sender === 'summary'
  }
])

const cardStyle = computed(() => {
  if (props.isCollapsed) {
    return {
      transform: `translateX(${props.index * 15}px)`,
      zIndex: props.index
    }
  }
  
  // 扇形排布计算
  const totalCards = props.totalCards
  const maxAngle = Math.min(60, totalCards * 8) // 最大扇形角度
  const angleStep = totalCards > 1 ? maxAngle / (totalCards - 1) : 0
  const startAngle = -maxAngle / 2
  const angle = startAngle + props.index * angleStep
  
  // 计算位置
  const radius = 100 + props.index * 5 // 稍微错开距离
  const translateX = Math.sin(angle * Math.PI / 180) * radius
  const translateY = -Math.abs(Math.cos(angle * Math.PI / 180)) * 20
  
  return {
    transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
    zIndex: props.isSelected ? 1000 : props.index,
    transformOrigin: 'center bottom'
  }
})

const handleCardClick = () => {
  emit('select', props.card.id)
}

const handleCardDoubleClick = () => {
  emit('reply', props.card)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
.playing-card {
  position: absolute;
  width: 80px;
  height: 120px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.playing-card.collapsed {
  width: 60px;
  height: 80px;
}

.playing-card.summary-card {
  background: linear-gradient(145deg, #fff3e0, #ffcc80);
  border-color: #ff9800;
}

.playing-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 999 !important;
}

.playing-card.selected {
  transform: translateY(-20px) scale(1.1);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-color: #050505;
  background: linear-gradient(145deg, #fff3e0, #ffe0b2);
}

.card-content {
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 10px;
}

.collapsed .card-content {
  padding: 4px;
  font-size: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-number {
  font-weight: bold;
  color: #666;
  font-size: 12px;
}

.collapsed .card-number {
  font-size: 10px;
}

.card-body {
  flex: 1;
  overflow: hidden;
}

.card-text {
  margin: 0;
  line-height: 1.2;
  color: #333;
  word-break: break-word;
  font-size: 9px;
}

.collapsed .card-text {
  font-size: 7px;
}

.card-footer {
  margin-top: auto;
  text-align: center;
}

.card-time {
  color: #999;
  font-size: 8px;
}

.collapsed .card-time {
  font-size: 6px;
}

.card-type {
  font-size: 14px;
}

.collapsed .card-type {
  font-size: 12px;
}

.card-range {
  margin: 2px 0 0 0;
  font-size: 7px;
  color: #666;
  font-style: italic;
}

.collapsed .card-range {
  font-size: 6px;
}



/* 动画效果 */
@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.playing-card {
  animation: cardAppear 0.5s ease-out;
}
</style>