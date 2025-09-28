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

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  opacity: number
  life: number
  maxLife: number
  color: string
}

const starFieldRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()

let animationId: number
let stars: Star[] = []
let meteors: Meteor[] = []
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D
let width = 0
let height = 0
let mouseX = 0
let mouseY = 0
let isMouseInside = false
let lastMeteorTime = 0

const STAR_COUNT = 200
const MOUSE_RADIUS = 500
const REPULSION_FORCE = 0.5
const RETURN_FORCE = 0.05
const FRICTION = 0.95
const METEOR_INTERVAL = 10000 // 每1000毫秒（1秒）生成一颗流星

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
      size: Math.random() * 1 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      vx: 0,
      vy: 0,
      isAffected: false
    })
  }
}

const createMeteor = () => {
  const colors = ['#ffffff', '#ffddaa', '#aaddff', '#ddaaff']
  const side = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left
  let x, y, vx, vy

      x = Math.random() * width
      y = -50
      vx = (Math.random() - 0.5) * 4
      vy = Math.random() * 3 + 2
  
  
  const maxLife = Math.random() * 300 + 200
  meteors.push({
    x,
    y,
    vx,
    vy,
    length: Math.random() * 30 + 20,
    opacity: 1,
    life: maxLife,
    maxLife,
    color: colors[Math.floor(Math.random() * colors.length)]
  })
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

const updateMeteors = () => {
  // 生成新流星
  const currentTime = Date.now()
  if (currentTime - lastMeteorTime > Math.floor(Math.random()*METEOR_INTERVAL)) {
    for(let i=0;i<Math.floor(Math.random()*5);i++)
    createMeteor()
    lastMeteorTime = currentTime
  }
  
  // 更新现有流星
  for (let i = meteors.length - 1; i >= 0; i--) {
    const meteor = meteors[i]
    
    // 更新位置
    meteor.x += meteor.vx
    meteor.y += meteor.vy
    
    // 更新生命值和透明度
    meteor.life--
    meteor.opacity = meteor.life / meteor.maxLife
    
    // 移除死亡或超出边界的流星
    if (meteor.life <= 0 || 
        meteor.x < -100 || meteor.x > width + 100 ||
        meteor.y < -100 || meteor.y > height + 100) {
      meteors.splice(i, 1)
    }
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
}

const drawMeteors = () => {
  for (let meteor of meteors) {
    // 计算流星尾巴的起点
    const tailX = meteor.x - meteor.vx * meteor.length / 10
    const tailY = meteor.y - meteor.vy * meteor.length / 10
    
    // 解析颜色
    const r = parseInt(meteor.color.slice(1, 3), 16)
    const g = parseInt(meteor.color.slice(3, 5), 16)
    const b = parseInt(meteor.color.slice(5, 7), 16)
    
    // 创建渐变效果
    const gradient = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y)
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${meteor.opacity})`)
    
    // 绘制流星轨迹
    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(meteor.x, meteor.y)
    ctx.stroke()
    
    // 绘制流星头部光点
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${meteor.opacity})`
    ctx.beginPath()
    ctx.arc(meteor.x, meteor.y, 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制流星光晕
    const glowGradient = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 8)
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${meteor.opacity * 0.4})`)
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.arc(meteor.x, meteor.y, 8, 0, Math.PI * 2)
    ctx.fill()
  }
}

const animate = () => {
  updateStars()
  updateMeteors()
  drawStars()
  drawMeteors()
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