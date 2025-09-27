import { ref, onMounted, onUnmounted, readonly, type Ref } from 'vue'

export interface Position {
  x: number
  y: number
}

export function useDraggable(elementRef: Ref<HTMLElement | null>) {
  const isDragging = ref(false)
  const position = ref<Position>({ x: 0, y: 0 })
  const dragOffset = ref<Position>({ x: 0, y: 0 })
  
  let startPosition: Position = { x: 0, y: 0 }
  let initialMousePosition: Position = { x: 0, y: 0 }

  const handleMouseDown = (event: MouseEvent) => {
    if (!elementRef.value) return
    
    event.preventDefault()
    isDragging.value = true
    
    const rect = elementRef.value.getBoundingClientRect()
    initialMousePosition = { x: event.clientX, y: event.clientY }
    
    // 如果是第一次拖拽，从元素当前位置开始
    if (position.value.x === 0 && position.value.y === 0) {
      position.value = {
        x: rect.left,
        y: rect.top
      }
    }
    
    startPosition = { x: position.value.x, y: position.value.y }
    
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    // 添加拖拽样式
    if (elementRef.value) {
      elementRef.value.style.cursor = 'grabbing'
      elementRef.value.style.userSelect = 'none'
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return
    
    const deltaX = event.clientX - initialMousePosition.x
    const deltaY = event.clientY - initialMousePosition.y
    
    position.value = {
      x: startPosition.x + deltaX,
      y: startPosition.y + deltaY
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    // 恢复样式
    if (elementRef.value) {
      elementRef.value.style.cursor = 'grab'
      elementRef.value.style.userSelect = 'auto'
    }
  }

  const resetPosition = () => {
    position.value = { x: 0, y: 0 }
  }

  const setPosition = (newPosition: Position) => {
    position.value = { ...newPosition }
  }

  const initializePosition = () => {
    if (elementRef.value && position.value.x === 0 && position.value.y === 0) {
      const rect = elementRef.value.getBoundingClientRect()
      position.value = {
        x: rect.left,
        y: rect.top
      }
    }
  }

  onMounted(() => {
    if (elementRef.value) {
      elementRef.value.addEventListener('mousedown', handleMouseDown)
      elementRef.value.style.cursor = 'grab'
    }
  })

  onUnmounted(() => {
    if (elementRef.value) {
      elementRef.value.removeEventListener('mousedown', handleMouseDown)
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    isDragging: readonly(isDragging),
    position: readonly(position),
    resetPosition,
    setPosition,
    initializePosition
  }
}