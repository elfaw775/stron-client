<template>
  <div :class="deckClasses">
    <!-- 控制按钮组 -->
    <div class="control-buttons">
      <button 
        @click="toggleCollapse"
        class="toggle-button"
        :class="{ 'collapsed': isCollapsed }"
      >
        <ChevronUp v-if="!isCollapsed" class="w-4 h-4" />
        <ChevronDown v-else class="w-4 h-4" />
        <span class="card-count">{{ cards.length }}</span>
      </button>
      
      <button 
        @click="toggleDraggable"
        class="drag-toggle-button"
        :class="{ 'active': isDeckDraggable }"
        title="切换拖拽模式"
      >
        <Move class="w-4 h-4" />
      </button>
      
      <button 
        v-if="isDeckDraggable"
        @click="resetAllPositions"
        class="reset-button"
        title="重置位置"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
    </div>

    <!-- 扑克牌容器 -->
    <div class="cards-container" v-if="!isCollapsed || cards.length > 0">
      <PlayingCard
        v-for="(card, index) in displayCards"
        :key="card.id"
        :card="card"
        :index="index"
        :total-cards="displayCards.length"
        :is-selected="selectedCardId === card.id"
        :is-collapsed="isCollapsed"
        :is-draggable="isDeckDraggable"
        :drag-position="draggedCards.get(card.id)"
        @select="handleCardSelect"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      />
    </div>

    <!-- 选中卡片的详细信息 -->
    <div v-if="selectedCard && !isCollapsed" class="card-detail">
      <div class="detail-content">
        <div class="detail-header">
          <span class="detail-sender">{{ selectedCard.sender === 'user' ? '用户' : 'AI' }}</span>
          <span class="detail-time">{{ formatDetailTime(selectedCard.timestamp) }}</span>
          <button @click="closeDetail" class="close-button">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="detail-body">
          <p>{{ selectedCard.content }}</p>
        </div>
        <div class="detail-actions">
          <button @click="copyToClipboard" class="action-button">
            <Copy class="w-3 h-3 mr-1" />
            复制
          </button>
          <button @click="replyToCard" class="action-button">
            <Reply class="w-3 h-3 mr-1" />
            回复
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PlayingCard from './PlayingCard.vue'
import { ChevronUp, ChevronDown, X, Copy, Reply, Move, RotateCcw } from 'lucide-vue-next'

interface Card {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'assistant'
}

const props = defineProps<{
  cards: Card[]
}>()

const emit = defineEmits<{
  replyToCard: [card: Card]
  copyCard: [content: string]
}>()

// 拖拽状态管理
const draggedCards = ref<Map<string, { x: number; y: number }>>(new Map())
const isDeckDraggable = ref(false)

const isCollapsed = ref(false)
const selectedCardId = ref<string | null>(null)

const displayCards = computed(() => {
  // 只显示用户发送的消息作为扑克牌
  return props.cards.filter(card => card.sender === 'user')
})

const selectedCard = computed(() => {
  return displayCards.value.find(card => card.id === selectedCardId.value)
})

const deckClasses = computed(() => [
  'card-deck',
  {
    'collapsed': isCollapsed.value,
    'has-cards': displayCards.value.length > 0,
    'has-selection': selectedCardId.value !== null
  }
])

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) {
    selectedCardId.value = null
  }
}

const handleCardSelect = (cardId: string) => {
  if (selectedCardId.value === cardId) {
    selectedCardId.value = null
  } else {
    selectedCardId.value = cardId
  }
}

const closeDetail = () => {
  selectedCardId.value = null
}

const copyToClipboard = async () => {
  if (selectedCard.value) {
    try {
      await navigator.clipboard.writeText(selectedCard.value.content)
      emit('copyCard', selectedCard.value.content)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
}

const replyToCard = () => {
  if (selectedCard.value) {
    emit('replyToCard', selectedCard.value)
    selectedCardId.value = null
  }
}

const formatDetailTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 拖拽相关方法
const handleDragStart = (cardId: string) => {
  console.log('Drag started for card:', cardId)
}

const handleDragEnd = (cardId: string, position: { x: number; y: number }) => {
  draggedCards.value.set(cardId, position)
  console.log('Drag ended for card:', cardId, 'at position:', position)
}

const toggleDraggable = () => {
  isDeckDraggable.value = !isDeckDraggable.value
  if (!isDeckDraggable.value) {
    // 重置所有卡片位置
    draggedCards.value.clear()
  }
}

const resetAllPositions = () => {
  draggedCards.value.clear()
}

// 暴露方法给父组件
defineExpose({
  addCard: (card: Card) => {
    // 新卡片添加动画会自动触发
  },
  collapse: () => {
    isCollapsed.value = true
    selectedCardId.value = null
  },
  expand: () => {
    isCollapsed.value = false
  },
  toggleDraggable,
  resetAllPositions
})
</script>

<style scoped>
.card-deck {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 800px;
  height: 200px;
  pointer-events: none;
  z-index: 100;
  transition: all 0.3s ease;
}

.card-deck.collapsed {
  height: 60px;
}

.card-deck.has-selection {
  height: 300px;
}

.control-buttons {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  pointer-events: auto;
}

.toggle-button {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 20px 20px 0 0;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.toggle-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

.toggle-button.collapsed {
  border-radius: 20px;
}

.drag-toggle-button,
.reset-button {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.drag-toggle-button:hover,
.reset-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

.drag-toggle-button.active {
  background: rgba(59, 130, 246, 0.9);
  border-color: #3b82f6;
  color: white;
}

.drag-toggle-button.active:hover {
  background: rgba(59, 130, 246, 1);
}

.card-count {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  min-width: 16px;
  text-align: center;
}

.cards-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  pointer-events: auto;
}

.card-detail {
  position: absolute;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  animation: detailAppear 0.3s ease-out;
}

@keyframes detailAppear {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.detail-sender {
  font-weight: bold;
  color: #333;
}

.detail-time {
  font-size: 12px;
  color: #666;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
}

.close-button:hover {
  background: #f5f5f5;
  color: #333;
}

.detail-body {
  margin-bottom: 12px;
}

.detail-body p {
  margin: 0;
  line-height: 1.5;
  color: #333;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #e9e9e9;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-deck {
    max-width: 100%;
    padding: 0 16px;
  }
  
  .card-detail {
    width: calc(100% - 32px);
    max-width: none;
  }
}
</style>