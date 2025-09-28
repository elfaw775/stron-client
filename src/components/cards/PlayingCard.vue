<template>
  <div 
    ref="cardRef"
    :class="cardClasses"
    :style="cardStyle"
    @click="handleCardClick"
    @dblclick="handleCardDoubleClick"
    @mousedown="handleMouseDown"
  >
    <div class="card-content">
      <div class="card-header">
        <span class="card-number">{{ cardNumber }}</span>
        <span class="card-type">📝</span>
      </div>
      
      <!-- 多选模式指示器 -->
      <div v-if="multiSelectMode" class="multi-select-indicator">
        <div class="checkbox" :class="{ 'checked': isSelected }">
          <div v-if="isSelected" class="checkmark">✓</div>
        </div>
      </div>
      <div class="card-body">
        <p class="card-text">{{ truncatedContent }}</p>
        <p v-if="card.messageRange" class="card-range">{{ card.messageRange }}</p>
      </div>
      <div class="card-footer">
        <span class="card-time">{{ formatTime(card.timestamp) }}</span>
      </div>
    </div>
    
    <!-- 拖拽时的预览 -->
    <div v-if="isDragging" class="drag-preview">
      <div class="drag-content">{{ card.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'

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
  multiSelectMode?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  reply: [card: Card]
  dragToInput: [content: string]
}>()

const cardRef = ref<HTMLElement>()
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragThreshold = 5 // 拖拽阈值，避免点击时误触发拖拽

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
    'summary-card': props.card.sender === 'summary',
    'dragging': isDragging.value,
    'multi-select-mode': props.multiSelectMode
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
  if (!isDragging.value) {
    emit('select', props.card.id)
  }
}

const handleCardDoubleClick = () => {
  if (!isDragging.value) {
    emit('reply', props.card)
  }
}

const handleMouseDown = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  
  // 添加全局事件监听器
  document.addEventListener('mousemove', handleMouseMove, { passive: false })
  document.addEventListener('mouseup', handleMouseUp, { passive: false })
  
  // 添加额外的事件监听器确保能取消拖拽
  document.addEventListener('mouseleave', handleMouseUp, { passive: false })
  document.addEventListener('keydown', handleKeyDown, { passive: false })
  window.addEventListener('blur', handleMouseUp, { passive: false })
}

const handleMouseMove = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  const deltaX = Math.abs(event.clientX - dragStartPos.value.x)
  const deltaY = Math.abs(event.clientY - dragStartPos.value.y)
  
  // 超过阈值才开始拖拽
  if (!isDragging.value && (deltaX > dragThreshold || deltaY > dragThreshold)) {
    startDragging()
  }
  
  if (isDragging.value && cardRef.value) {
    // 更新卡片位置跟随鼠标
    cardRef.value.style.position = 'fixed'
    cardRef.value.style.left = `${event.clientX - 40}px`
    cardRef.value.style.top = `${event.clientY - 60}px`
    cardRef.value.style.zIndex = '9999'
    cardRef.value.style.visibility = 'visible'
    cardRef.value.style.display = 'block'
    cardRef.value.style.opacity = '0.9'
    
    // 检查是否在输入框区域
    checkDropTarget(event.clientX, event.clientY)
  }
}

const handleMouseUp = (event?: Event) => {
  console.log('Mouse up detected, isDragging:', isDragging.value)
  
  // 移除所有事件监听器
  cleanupEventListeners()
  
  let dropSuccessful = false
  
  if (isDragging.value && event && 'clientX' in event && 'clientY' in event) {
    // 检查是否拖拽到输入框
    const mouseEvent = event as MouseEvent
    const dropTarget = getDropTarget(mouseEvent.clientX, mouseEvent.clientY)
    if (dropTarget) {
      console.log('Dropping content to input:', props.card.content)
      emit('dragToInput', props.card.content)
      dropSuccessful = true
    }
  }
  
  // 总是重置拖拽状态，无论是否成功拖拽
  resetDragState()
  
  // 如果拖拽成功，额外确保状态被重置
  if (dropSuccessful) {
    setTimeout(() => {
      if (isDragging.value) {
        console.log('Force resetting drag state after successful drop')
        resetDragState()
      }
    }, 100)
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  // ESC键取消拖拽
  if (event.key === 'Escape' && isDragging.value) {
    event.preventDefault()
    cleanupEventListeners()
    resetDragState()
  }
}

const cleanupEventListeners = () => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mouseleave', handleMouseUp)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('blur', handleMouseUp)
}

const checkDropTarget = (x: number, y: number) => {
  const target = getDropTarget(x, y)
  
  // 更新拖拽区域的视觉反馈
  const inputArea = document.querySelector('.chat-input-area')
  if (inputArea) {
    if (target) {
      inputArea.classList.add('drag-over')
    } else {
      inputArea.classList.remove('drag-over')
    }
  }
}

const getDropTarget = (x: number, y: number): Element | null => {
  // 临时禁用卡片的指针事件来检测下方元素
  const originalPointerEvents = cardRef.value?.style.pointerEvents
  if (cardRef.value) {
    cardRef.value.style.pointerEvents = 'none'
  }
  
  const elementBelow = document.elementFromPoint(x, y)
  
  // 恢复原始的指针事件设置
  if (cardRef.value) {
    cardRef.value.style.pointerEvents = originalPointerEvents || ''
  }
  
  // 检查是否是输入框或其父容器
  return elementBelow?.closest('textarea, .chat-input-area') || null
}

const startDragging = () => {
  console.log('Starting drag for card:', props.card.id)
  isDragging.value = true
  document.body.style.cursor = 'grabbing'
  document.body.classList.add('dragging-card')
  
  // 防止页面滚动和选择
  document.body.style.overflow = 'hidden'
  document.body.style.userSelect = 'none'
  
  // 确保卡片在拖拽时可见
  if (cardRef.value) {
    cardRef.value.style.visibility = 'visible'
    cardRef.value.style.display = 'block'
  }
}

const resetDragState = () => {
  console.log('Resetting drag state for card:', props.card.id)
  
  isDragging.value = false
  
  // 重置全局样式
  document.body.style.cursor = ''
  document.body.style.overflow = ''
  document.body.style.userSelect = ''
  document.body.classList.remove('dragging-card')
  
  // 移除拖拽区域的视觉反馈
  const inputArea = document.querySelector('.chat-input-area')
  if (inputArea) {
    inputArea.classList.remove('drag-over')
  }
  
  // 重置卡片样式
  if (cardRef.value) {
    // 清除所有拖拽相关的内联样式
    cardRef.value.style.position = ''
    cardRef.value.style.left = ''
    cardRef.value.style.top = ''
    cardRef.value.style.zIndex = ''
    cardRef.value.style.pointerEvents = ''
    cardRef.value.style.transform = ''
    cardRef.value.style.visibility = ''
    cardRef.value.style.display = ''
    cardRef.value.style.opacity = ''
    
    // 强制重新渲染
    cardRef.value.offsetHeight // 触发重排
  }
  
  // 延迟确保状态完全重置
  setTimeout(() => {
    if (cardRef.value && isDragging.value === false) {
      cardRef.value.style.cssText = '' // 清除所有内联样式
    }
  }, 50)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 组件卸载时清理拖拽状态
onUnmounted(() => {
  cleanupEventListeners()
  
  // 重置拖拽状态
  if (isDragging.value) {
    resetDragState()
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

.playing-card.summary-card {
  background: linear-gradient(145deg, #ffffff, #b4b4b4);
  border-color: #ffffff;
}

.playing-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 999 !important;
}

.playing-card.selected {
  transform: translateY(-20px) scale(1.1);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  border-color: #9cdacc;
  background: linear-gradient(145deg, #ffffff, #93c9d1);
  border-width: 1px;
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

/* 拖拽状态样式 */
.playing-card.dragging {
  transform: scale(1.1) !important;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4) !important;
  opacity: 0.9 !important;
  z-index: 9999 !important;
  pointer-events: none !important;
  position: fixed !important;
  transition: none !important; /* 禁用过渡动画，让拖拽更流畅 */
}

.drag-preview {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  z-index: 10000;
}

.drag-preview::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

/* 全局拖拽状态 */
:global(body.dragging-card) {
  user-select: none;
}

:global(body.dragging-card *) {
  cursor: grabbing !important;
}

/* 多选模式样式 */
.playing-card.multi-select-mode {
  cursor: pointer;
}

.playing-card.multi-select-mode.selected {
  border-color: #4CAF50 !important;
  background: linear-gradient(145deg, #e8f5e8, #d4edda) !important;
}

.multi-select-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

.checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 3px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #4CAF50;
  border-color: #4CAF50;
}

.checkmark {
  color: white;
  font-size: 10px;
  font-weight: bold;
}
</style>