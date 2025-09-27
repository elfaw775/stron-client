<template>
  <div 
    class="star-field" 
    ref="starFieldRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <canvas ref="canvasRef" class="star-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Star {
  x: number
  y: number
  originalX: number
  originalY: number
  size: number
  opacity: number
  vx: number
  vy: number
  isAffected: boolean
}

const starFieldRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()

let animationId: number
let stars: Star[] = []
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let width = 0
let height = 0
let mouseX = 0
let mouseY = 0
let isMouseInside = false

const STAR_COUNT = 200
const MOUSE_RADIUS = 120
const REPULSION_FORCE = 0.3
const RETURN_FORCE = 0.01
const FRICTION = 0.80

const initCanvas = () => {
  canvas = canvasRef.value!
  ctx = canvas.getContext('2d')!
  
  const updateSize = () => {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
    createStars()
  }
  
  updateSize()
  window.addEventListener('resize', updateSize)
  
  return () => window.removeEventListener('resize', updateSize)
}

const createStars = () => {
  stars = []
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    stars.push({
      x,
      y,
      originalX: x,
      originalY: y,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      vx: 0,
      vy: 0,
      isAffected: false
    })
  }
}

const handleMouseMove = (event: MouseEvent) => {
    console.log(event.pageX,event.pageY);
  const rect = canvas.getBoundingClientRect()
  mouseX = event.clientX - rect.left
  mouseY = event.clientY - rect.top
  isMouseInside = true
}

const handleMouseLeave = () => {
  isMouseInside = false
}

const updateStars = () => {
  for (let star of stars) {
    if (isMouseInside) {
      const dx = star.x - mouseX
      const dy = star.y - mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < MOUSE_RADIUS) {
        star.isAffected = true
        const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS
        const angle = Math.atan2(dy, dx)
        
        star.vx += Math.cos(angle) * force * REPULSION_FORCE
        star.vy += Math.sin(angle) * force * REPULSION_FORCE
      }
    }
    
    // 返回原位置的力
    const returnDx = star.originalX - star.x
    const returnDy = star.originalY - star.y
    star.vx += returnDx * RETURN_FORCE
    star.vy += returnDy * RETURN_FORCE
    
    // 应用摩擦力
    star.vx *= FRICTION
    star.vy *= FRICTION
    
    // 更新位置
    star.x += star.vx
    star.y += star.vy
    
    // 边界检查
    if (star.x < 0) star.x = 0
    if (star.x > width) star.x = width
    if (star.y < 0) star.y = 0
    if (star.y > height) star.y = height
    
    // 重置影响状态
    star.isAffected = false
  }
}

const drawStars = () => {
  // 清除画布
  ctx.fillStyle = 'rgba(0, 0, 0, 1)'
  ctx.fillRect(0, 0, width, height)
  
  // 绘制星星
  for (let star of stars) {
    const twinkle = Math.sin(Date.now() * 0.003 + star.originalX * 0.01) * 0.3 + 0.7
    const opacity = star.opacity * twinkle
    
    // 星星主体
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
    
    // 星星光晕
    if (star.size > 2) {
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  // 绘制鼠标影响区域（调试用，可以注释掉）
  if (isMouseInside) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, MOUSE_RADIUS, 0, Math.PI * 2)
    ctx.stroke()
  }
}

const animate = () => {
  updateStars()
  drawStars()
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  const cleanup = initCanvas()
  animate()
  
  onUnmounted(() => {
    cleanup()
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })
})
</script>

<style scoped>
.star-field {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: 
    radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 50%, #000000 100%);
  overflow: hidden;
  pointer-events: auto;
}

.star-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>