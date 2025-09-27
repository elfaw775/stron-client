<template>
  <div 
    ref="cardRef"
    :class="cardClasses"
    :style="cardStyle"
    @click="handleCardClick"
  >
    <div class="card-content">
      <div class="card-header">
        <span class="card-number">{{ cardNumber }}</span>
        <div class="drag-handle" v-if="isDraggable">
          <div class="drag-dots"></div>
        </div>
      </div>
      <div class="card-body">
        <p class="card-text">{{ truncatedContent }}</p>
      </div>
      <div class="card-footer">
        <span class="card-time">{{ formatTime(card.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDraggable } from '@/composables/useDraggable'

interface Card {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'assistant'
}

const props = defineProps<{
  card: Card
  index: number
  totalCards: number
  isSelected: boolean
  isCollapsed: boolean
  isDraggable?: boolean
  dragPosition?: { x: number; y: number }
}>()

const emit = defineEmits<{
  select: [id: string]
  dragStart: [id: string]
  dragEnd: [id: string, position: { x: number; y: number }]
}>()

const cardRef = ref<HTMLElement | null>(null)
const { isDragging, position, setPosition, initializePosition } = useDraggable(cardRef)

// 监听拖拽模式变化
watch(() => props.isDraggable, (isDraggable) => {
  if (isDraggable) {
    // 进入拖拽模式时，初始化位置
    setTimeout(() => {
      initializePosition()
    }, 100)
  }
})

// 监听外部传入的拖拽位置变化
watch(() => props.dragPosition, (newPosition) => {
  if (newPosition && props.isDraggable) {
    setPosition(newPosition)
  }
}, { immediate: true })

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
    'dragging': isDragging.value,
    'draggable': props.isDraggable,
    'user-card': props.card.sender === 'user',
    'assistant-card': props.card.sender === 'assistant'
  }
])

const cardStyle = computed(() => {
  const baseStyle: any = {}
  
  // 如果是可拖拽的，使用拖拽位置
  if (props.isDraggable) {
    baseStyle.transform = `translate(${position.value.x}px, ${position.value.y}px)`
    baseStyle.zIndex = isDragging.value ? 9999 : (props.isSelected ? 1000 : props.index + 100)
    baseStyle.position = 'fixed'
    return baseStyle
  }
  
  // 原有的扇形排布逻辑
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

const handleCardClick = (event: MouseEvent) => {
  // 如果正在拖拽，不触发选择事件
  if (isDragging.value) {
    return
  }
  emit('select', props.card.id)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 监听拖拽状态变化
watch(isDragging, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    emit('dragStart', props.card.id)
  } else if (!newValue && oldValue) {
    emit('dragEnd', props.card.id, position.value)
  }
})
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

.playing-card.user-card {
  background: linear-gradient(145deg, #e3f2fd, #bbdefb);
  border-color: #2196f3;
}

.playing-card.assistant-card {
  background: linear-gradient(145deg, #f3e5f5, #e1bee7);
  border-color: #9c27b0;
}

.playing-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 999 !important;
}

.playing-card.selected {
  transform: translateY(-20px) scale(1.1);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-color: #ff9800;
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

.drag-handle {
  cursor: grab;
  padding: 2px;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-dots {
  width: 12px;
  height: 8px;
  background-image: 
    radial-gradient(circle, #999 1px, transparent 1px),
    radial-gradient(circle, #999 1px, transparent 1px);
  background-size: 4px 4px;
  background-position: 0 0, 0 4px;
}

.playing-card.dragging {
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
  transform: scale(1.05);
  z-index: 9999 !important;
}

.playing-card.draggable {
  cursor: grab;
}

.playing-card.draggable:active {
  cursor: grabbing;
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