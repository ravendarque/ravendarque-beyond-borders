import type { FlagSpec } from '@/flags/schema'

export interface RenderOptions {
  size: 512 | 1024
  thicknessPct: number // 5..20
  paddingPct?: number
  outerStroke?: { color: string; widthPx: number }
  imageInsetPx?: number // inset between image edge and inner ring
  backgroundColor?: string | null // null => transparent
}

export async function renderAvatar(
  image: ImageBitmap,
  flag: FlagSpec,
  options: RenderOptions
): Promise<Blob> {
  const size = options.size
  const thickness = Math.round((options.thicknessPct / 100) * size)
  const padding = Math.round(((options.paddingPct ?? 0) / 100) * size)

  // Create canvas
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext('2d')!

  // Background fill (optional, else transparent)
  if (options.backgroundColor) {
    ctx.save()
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, size, size)
    ctx.restore()
  }

  // Geometry
  const r = size / 2
  const ringOuter = r - Math.max(1, padding)
  const ringInner = Math.max(0, ringOuter - thickness)
  const imageInset = options.imageInsetPx ?? 0 // can be negative (outset)
  const imageRadius = clamp(ringInner - imageInset, 0, r - 0.5)

  // Draw circular masked image (kept inside border)
  ctx.save()
  ctx.beginPath()
  ctx.arc(r, r, imageRadius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  // Fit image into the inner circle (cover)
  const iw = image.width, ih = image.height
  const target = imageRadius * 2
  const scale = Math.max(target / iw, target / ih)
  const dw = iw * scale, dh = ih * scale
  ctx.drawImage(image, r - dw / 2, r - dh / 2, dw, dh)
  ctx.restore()

  // Draw ring segments for the flag

  // Build segments from stripes: map stripes -> polar arcs around the circle
  const stripes = flag.pattern.stripes
  const totalWeight = stripes.reduce((s: number, x: { weight: number }) => s + x.weight, 0)
  let start = -Math.PI / 2 // start at top center
  for (const stripe of stripes) {
    const frac = stripe.weight / totalWeight
    const sweep = Math.PI * 2 * frac
    const end = start + sweep
    drawRingArc(ctx, r, ringInner, ringOuter, start, end, stripe.color)
    start = end
  }

  // Optional outer stroke
  if (options.outerStroke) {
    ctx.beginPath()
    ctx.arc(r, r, ringOuter, 0, Math.PI * 2)
    ctx.strokeStyle = options.outerStroke.color
    ctx.lineWidth = options.outerStroke.widthPx
    ctx.stroke()
  }

  // Export PNG
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return blob
}

function drawRingArc(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  center: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  fill: string
) {
  ctx.beginPath()
  // Outer arc
  ctx.arc(center, center, outerR, startAngle, endAngle)
  // Inner arc (reverse)
  ctx.arc(center, center, innerR, endAngle, startAngle, true)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}
