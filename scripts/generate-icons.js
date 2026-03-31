const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0f172a'
  const r = size * 0.18
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Chart line
  const pad = size * 0.2
  const points = [
    [pad, size * 0.72],
    [size * 0.35, size * 0.45],
    [size * 0.52, size * 0.58],
    [size * 0.68, size * 0.3],
    [size - pad, size * 0.48],
  ]

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = size * 0.06
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(...points[0])
  points.slice(1).forEach(p => ctx.lineTo(...p))
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

const outDir = path.join(__dirname, 'public')

try {
  fs.writeFileSync(path.join(outDir, 'icon-192.png'), generateIcon(192))
  fs.writeFileSync(path.join(outDir, 'icon-512.png'), generateIcon(512))
  console.log('Icons generated successfully')
} catch (e) {
  console.log('canvas package not available, skipping icon generation')
  console.log('You can add custom icons manually to public/icon-192.png and public/icon-512.png')
}
