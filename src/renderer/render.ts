import type { FlagSpec } from '@/flags/schema'

export interface RenderOptions {
  size: 512 | 1024
  thicknessPct: number // 5..20
  paddingPct?: number
  outerStroke?: { color: string; widthPx: number }
  imageInsetPx?: number // inset between image edge and inner ring
  backgroundColor?: string | null // null => transparent
  borderShape?: 'circle' | 'rect'
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

  const shape = options.borderShape ?? 'circle'

  if (shape === 'circle') {
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
  } else {
    // Rectilinear border: concentric rectangular bands
    const outer = padding
    const ringOuterRect = { x: outer, y: outer, w: size - 2 * outer, h: size - 2 * outer }
    const ringInnerRect = insetRect(ringOuterRect, thickness)
    const imageInset = options.imageInsetPx ?? 0
    const imageRect = clampRect(insetRect(ringInnerRect, imageInset * -1), 0, size) // positive insetPct increased gap earlier

    // Draw rectangular masked image
    ctx.save()
    rectPath(ctx, imageRect)
    ctx.clip()

    const iw = image.width, ih = image.height
    const scale = Math.max(imageRect.w / iw, imageRect.h / ih)
    const dw = iw * scale, dh = ih * scale
    ctx.drawImage(image, imageRect.x + (imageRect.w - dw) / 2, imageRect.y + (imageRect.h - dh) / 2, dw, dh)
    ctx.restore()

    // Draw bands according to stripe weights
    const stripes = flag.pattern.stripes
    const totalWeight = stripes.reduce((s: number, x: { weight: number }) => s + x.weight, 0)
    let currentOuter = ringOuterRect
    for (const stripe of stripes) {
      const stripeTh = thickness * (stripe.weight / totalWeight)
      const nextInner = insetRect(currentOuter, stripeTh)
      // Draw ring region between currentOuter and nextInner using evenodd
      ctx.beginPath()
      rectPath(ctx, currentOuter)
      rectPath(ctx, nextInner)
      ctx.fillStyle = stripe.color
      ctx.fill('evenodd')
      currentOuter = nextInner
    }

    // Optional outer stroke
    if (options.outerStroke) {
      ctx.beginPath()
      rectPath(ctx, ringOuterRect)
      ctx.strokeStyle = options.outerStroke.color
      ctx.lineWidth = options.outerStroke.widthPx
      ctx.stroke()
    }
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

function rectPath(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number }
) {
  ctx.moveTo(r.x, r.y)
  ctx.rect(r.x, r.y, r.w, r.h)
}

function insetRect(r: { x: number; y: number; w: number; h: number }, inset: number) {
  return { x: r.x + inset, y: r.y + inset, w: r.w - inset * 2, h: r.h - inset * 2 }
}

function clampRect(r: { x: number; y: number; w: number; h: number }, min: number, max: number) {
  const x = clamp(r.x, min, max)
  const y = clamp(r.y, min, max)
  const w = clamp(r.w, min, max)
  const h = clamp(r.h, min, max)
  return { x, y, w, h }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}
