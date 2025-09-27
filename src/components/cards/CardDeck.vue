<template>
  <div :class="deckClasses">
    <!-- 折叠/展开按钮 -->
    <button v-if="displayCards.length > 0"                           
      @click="toggleCollapse"
      class="toggle-button"
      :class="{ 'collapsed': isCollapsed }"
    >
      <ChevronUp v-if="!isCollapsed" class="w-4 h-4" />
      <ChevronDown v-else class="w-4 h-4" />
      <span class="card-count">{{ displayCards.length }}</span>  
    </button>

    <!-- 扑克牌容器 -->
    <div class="cards-container" v-if="!isCollapsed">
      <PlayingCard
        v-for="(card, index) in displayCards"
        :key="card.id"
        :card="card"
        :index="index"
        :total-cards="displayCards.length"
        :is-selected="selectedCardId === card.id"
        :is-collapsed="isCollapsed"
        @select="handleCardSelect"
        @reply="handleCardReply"
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
import { ChevronUp, ChevronDown, X, Copy, Reply } from 'lucide-vue-next'

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
}>()

const isCollapsed = ref(true) // 默认折叠
const selectedCardId = ref<string | null>(null)

const displayCards = computed(() => {
  // 显示所有总结卡片
  return props.cards.filter(card => card.sender === 'summary')
})

const selectedCard = computed(() => {
  return displayCards.value.find(card => card.id === selectedCardId.value)
})

const deckClasses = computed(() => [
  'card-deck-footer',
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

// 处理卡片双击回复
const handleCardReply = (card: Card) => {
  emit('replyToCard', card)
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

.cards-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding: 20px;
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