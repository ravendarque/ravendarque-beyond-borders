import { useEffect, useMemo, useRef, useState } from 'react'
import { flags } from '@/flags/flags'
import type { FlagSpec } from '@/flags/schema'
import { renderAvatar } from '@/renderer/render'

export function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [flagId, setFlagId] = useState(flags[0]?.id ?? '')
  const [thickness, setThickness] = useState(7)
  const [size, setSize] = useState<512 | 1024>(512)
  const [insetPx, setInsetPx] = useState(0) // +inset, -outset
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const selectedFlag = useMemo<FlagSpec | undefined>(() => flags.find(f => f.id === flagId), [flagId])

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setImageUrl(url)
  }

  async function draw() {
    if (!imageUrl || !selectedFlag || !canvasRef.current) return
    const img = await createImageBitmap(await (await fetch(imageUrl)).blob())
    const blob = await renderAvatar(img, selectedFlag, {
      size,
      thicknessPct: thickness,
      imageInsetPx: insetPx,
    })
    const c = canvasRef.current
    const ctx = c.getContext('2d')!
    c.width = size
    c.height = size
    ctx.clearRect(0,0,size,size)
    // Draw result blob back to canvas for preview
  const tmp = new Image()
  tmp.src = URL.createObjectURL(blob)
  await new Promise(resolve => { tmp.onload = () => resolve(null) })
  ctx.drawImage(tmp, 0, 0)
  }

  useEffect(() => {
    // Auto-apply whenever inputs change
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, flagId, thickness, size])

  return (
    <div style={{padding:16, maxWidth: 900, margin: '0 auto'}}>
      <h1>Beyond Borders</h1>
      <p>Add a circular, flag-colored border to your profile picture.</p>

      <div style={{display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap'}}>
        <div>
          <label>
            Upload image
            <input type="file" accept="image/png,image/jpeg" onChange={onFileChange} />
          </label>

          <div style={{marginTop:12}}>
            <label>
              Flag
              <select value={flagId} onChange={e => setFlagId(e.target.value)}>
                {flags.map(f => (
                  <option key={f.id} value={f.id}>{f.displayName}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{marginTop:12}}>
            <label>
              Border thickness: {thickness}%
              <input type="range" min={5} max={20} value={thickness} onChange={e => setThickness(parseInt(e.target.value))} />
            </label>
          </div>

          <div style={{marginTop:12}}>
            <label>
              Size
              <select value={size} onChange={e => setSize(parseInt(e.target.value) as 512 | 1024)}>
                <option value={512}>512x512</option>
                <option value={1024}>1024x1024</option>
              </select>
            </label>
          </div>

          <div style={{marginTop:12}}>
            <label>
              Inset (+) / Outset (-): {insetPx}px
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={insetPx}
                onChange={e => setInsetPx(parseInt(e.target.value))}
              />
            </label>
          </div>

          <div style={{marginTop:12, display:'flex', gap:8}}>
            {imageUrl && selectedFlag && (
              <a
                onClick={async (e) => {
                  e.preventDefault()
                  const img = await createImageBitmap(await (await fetch(imageUrl)).blob())
                  const blob = await renderAvatar(img, selectedFlag, { size, thicknessPct: thickness, imageInsetPx: insetPx })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `beyond-borders_${selectedFlag.id}_${size}.png`
                  a.click()
                }}
                href="#"
              >
                Download PNG
              </a>
            )}
          </div>
        </div>

        <div>
          <canvas ref={canvasRef} width={size} height={size} style={{width: size/2, height: size/2, border:'1px solid #ddd', borderRadius: 8}} />
        </div>
      </div>
    </div>
  )
}
