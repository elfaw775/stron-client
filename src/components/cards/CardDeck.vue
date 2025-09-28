<template>
  <div :class="deckClasses">
    <!-- 折叠/展开按钮 -->
    <button                          
      @click="toggleCollapse"
      class="toggle-button"
      :class="{ 'collapsed': isCollapsed }"
    >
      <ChevronUp v-if="!isCollapsed" class="w-4 h-4" />
      <ChevronDown v-else class="w-4 h-4" />
      <span class="card-count">{{ displayCards.length }}</span>  
    </button>

    <!-- 多选模式工具栏 -->
    <div v-if="!isCollapsed" class="toolbar">
      <div class="toolbar-left">
        <button 
          @click="toggleMultiSelectMode" 
          class="toolbar-button"
          :class="{ 'active': isMultiSelectMode }"
        >
          <CheckSquare v-if="isMultiSelectMode" class="w-4 h-4" />
          <Square v-else class="w-4 h-4" />
          多选
        </button>
      </div>
      
      <div class="toolbar-right" v-if="isMultiSelectMode">
        <button 
          @click="summarizeSelectedCards" 
          class="toolbar-button primary"
          :disabled="selectedCardIds.size === 0 || isSummarizing"
        >
          <div v-if="isSummarizing" class="loading-spinner"></div>
          <MessageSquare v-else class="w-4 h-4" />
          {{ isSummarizing ? 'AI总结中...' : 'AI总结到输入框' }}
        </button>
      </div>
    </div>

    <!-- 扑克牌容器 -->
    <div class="cards-container" v-if="!isCollapsed">
      <PlayingCard
        v-for="(card, index) in displayCards"
        :key="card.id"
        :card="card"
        :index="index"
        :total-cards="displayCards.length"
        :is-selected="isMultiSelectMode ? selectedCardIds.has(card.id) : selectedCardId === card.id"
        :is-collapsed="isCollapsed"
        :multi-select-mode="isMultiSelectMode"
        @select="handleCardSelect"
        @reply="handleCardReply"
        @drag-to-input="handleDragToInput"
      />
    </div>

    <!-- 选中卡片的详细信息 -->
    <div v-if="selectedCard && !isCollapsed" class="card-detail">
      <div class="detail-content">
        <div class="detail-header">
          <span class="detail-sender">AI总结</span>
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
import { ChevronUp, ChevronDown, X, Copy, Reply, CheckSquare, Square, MessageSquare } from 'lucide-vue-next'

interface Card {
  id: string
  content: string
  timestamp: Date
  sender: 'summary'
  messageRange?: string
  originalMessages?: any[]
}

const props = defineProps<{
  cards: Card[]
}>()

const emit = defineEmits<{
  replyToCard: [card: Card]
  copyCard: [content: string]
  dragToInput: [content: string]
  summarizeCards: [cards: Card[]]
}>()

const isCollapsed = ref(true) // 默认折叠
const selectedCardId = ref<string | null>(null)
const selectedCardIds = ref<Set<string>>(new Set()) // 多选卡片ID集合
const isMultiSelectMode = ref(false) // 多选模式
const isSummarizing = ref(false) // AI总结中状态

const displayCards = computed(() => {
  // 显示所有总结卡片
  return props.cards.filter(card => card.sender === 'summary')
})

const selectedCard = computed(() => {
  return displayCards.value.find(card => card.id === selectedCardId.value)
})

const selectedCards = computed(() => {
  return displayCards.value.filter(card => selectedCardIds.value.has(card.id))
})

const deckClasses = computed(() => [
  'card-deck-footer',
  {
    'collapsed': isCollapsed.value,
    'has-cards': displayCards.value.length > 0,
    'has-selection': selectedCardId.value !== null,
    'multi-select-mode': isMultiSelectMode.value,
    'has-multi-selection': selectedCardIds.value.size > 0
  }
])

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) {
    selectedCardId.value = null
    selectedCardIds.value.clear()
    isMultiSelectMode.value = false
  }
}

const toggleMultiSelectMode = () => {
  isMultiSelectMode.value = !isMultiSelectMode.value
  if (!isMultiSelectMode.value) {
    selectedCardIds.value.clear()
  } else {
    selectedCardId.value = null
  }
}

const handleCardSelect = (cardId: string) => {
  if (isMultiSelectMode.value) {
    // 多选模式
    if (selectedCardIds.value.has(cardId)) {
      selectedCardIds.value.delete(cardId)
    } else {
      selectedCardIds.value.add(cardId)
    }
    // 触发响应式更新
    selectedCardIds.value = new Set(selectedCardIds.value)
  } else {
    // 单选模式
    if (selectedCardId.value === cardId) {
      selectedCardId.value = null
    } else {
      selectedCardId.value = cardId
    }
  }
}

const selectAllCards = () => {
  selectedCardIds.value = new Set(displayCards.value.map(card => card.id))
}

const clearSelection = () => {
  selectedCardIds.value.clear()
  selectedCardIds.value = new Set()
}

const summarizeSelectedCards = async () => {
  if (selectedCards.value.length > 0) {
    isSummarizing.value = true
    try {
      emit('summarizeCards', selectedCards.value)
      // 清空选择
      clearSelection()
    } finally {
      // 延迟重置状态，给用户足够的视觉反馈
      setTimeout(() => {
        isSummarizing.value = false
      }, 1000)
    }
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

// 处理卡片双击回复
const handleCardReply = (card: Card) => {
  emit('replyToCard', card)
}

// 处理卡片拖拽到输入框
const handleDragToInput = (content: string) => {
  console.log('CardDeck handling drag to input:', content)
  emit('dragToInput', content)
  
  // 确保所有拖拽状态被重置
  setTimeout(() => {
    // 移除所有可能的拖拽样式
    document.body.classList.remove('dragging-card')
    document.body.style.cursor = ''
    document.body.style.overflow = ''
    document.body.style.userSelect = ''
    
    // 移除输入区域的拖拽样式
    const inputArea = document.querySelector('.chat-input-area')
    if (inputArea) {
      inputArea.classList.remove('drag-over')
    }
  }, 50)
}

const formatDetailTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 暴露方法给父组件
defineExpose({
  collapse: () => {
    isCollapsed.value = true
    selectedCardId.value = null
  },
  expand: () => {
    isCollapsed.value = false
  }
})
</script>

<style scoped>
.card-deck-footer {
  position: relative;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.card-deck-footer.collapsed {
  height: 60px;
}

.card-deck-footer:not(.collapsed) {
  height: 200px;
}

.card-deck-footer.has-selection:not(.collapsed) {
  height: 300px;
}

.card-deck-footer.multi-select-mode:not(.collapsed) {
  height: 250px;
}

.card-deck-footer.multi-select-mode.has-multi-selection:not(.collapsed) {
  height: 250px;
}

.toggle-button {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.toggle-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateX(-50%) translateY(-2px);
}

.card-count {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  min-width: 16px;
  text-align: center;
  background: #f0f0f0;
  border-radius: 10px;
  padding: 2px 6px;
}

.toolbar {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.toolbar-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 1);
  color: #333;
  transform: translateY(-1px);
}

.toolbar-button.active {
  background: #000000;
  color: white;
  border-color: #4CAF50;
}

.toolbar-button.primary {
  background: #000000;
  color: white;
  border-color: #000000;
}

.toolbar-button.primary:hover:not(:disabled) {
  background: #ffffff;
  border-color: #686868;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.selection-count {
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cards-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 50px 20px 20px; /* 增加顶部padding为工具栏留空间 */
  overflow: hidden;
}

.card-detail {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: detailAppear 0.3s ease-out;
  margin-bottom: 10px;
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
  transition: all 0.2s ease;
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
  .card-deck-footer:not(.collapsed) {
    height: 180px;
  }
  
  .card-deck-footer.has-selection:not(.collapsed) {
    height: 280px;
  }
  
  .cards-container {
    padding: 15px;
  }
  
  .card-detail {
    width: calc(100% - 20px);
    max-width: none;
  }
}
</style>