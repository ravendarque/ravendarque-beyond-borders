import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { ThemeModeContext } from '../main';
import { flags } from '../flags/flags';
import FlagSwatch from '@/components/FlagSwatch';
import type { FlagSpec } from '../flags/schema';
import { renderAvatar } from '@/renderer/render';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Grid from '@mui/material/Unstable_Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FileUploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

export function App() {
  const { mode, setMode } = useContext(ThemeModeContext);
  const [inputMode, setInputMode] = useState<'none' | 'image' | 'flag'>('none');

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string>('');
  const [thickness, setThickness] = useState(7);
  const size = 1024 as const; // Size of the canvas (fixed at 1024)
  const [insetPct, setInsetPct] = useState(0); // +inset, -outset as percent of size
  const [bg, setBg] = useState<string | 'transparent'>('transparent');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const checkerRef = useRef<HTMLCanvasElement | null>(null);
  const theme = useTheme();
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingRef = useRef<{ down: boolean; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const imageBitmapRef = useRef<ImageBitmap | null>(null);
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const animRef = useRef<number | null>(null);
  const velocityRef = useRef<{ vx: number; vy: number } | null>(null);
  const imageOffsetRef = useRef<{ x: number; y: number }>(imageOffset);
  const lastMoveRef = useRef<{ clientX: number; clientY: number; t: number } | null>(null);
  const [presentation, setPresentation] = useState<'ring' | 'segment' | 'cutout'>('ring');
  const [flagImgFallback, setFlagImgFallback] = useState(false);
  const [flagPreviewError, setFlagPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const flagPreviewImgRef = useRef<HTMLImageElement | null>(null);
  // Cache rasterized canvases per-flag id to avoid repeated fetch/rasterize work
  // We keep a small LRU order to prevent unbounded memory usage.
  const rasterizedFlagCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const rasterizedFlagOrder = useRef<string[]>([]);
  const RASTER_CACHE_MAX = 12;

  function pruneRasterCacheIfNeeded() {
    const map = rasterizedFlagCache.current;
    const order = rasterizedFlagOrder.current;
    while (order.length > RASTER_CACHE_MAX) {
      const oldest = order.shift();
      if (oldest) map.delete(oldest);
    }
  }

  async function getRasterizedFlagCanvas(f: FlagSpec) {
    const cache = rasterizedFlagCache.current;
    const order = rasterizedFlagOrder.current;
    if (cache.has(f.id)) {
      // mark as recently used
      const idx = order.indexOf(f.id);
      if (idx >= 0) {
        order.splice(idx, 1);
        order.push(f.id);
      }
      return cache.get(f.id)!;
    }
    // Try SVG rasterize from public/flags if available
    if ((f as any).svgFilename) {
      try {
        const publicUrl = `/flags/${(f as any).svgFilename}`;
        const resp = await fetch(publicUrl);
        if (resp.ok) {
          const blob = await resp.blob();
          // Rasterize via Image element to produce a canvas
          try {
            const url = URL.createObjectURL(blob);
            const imgEl = new Image();
            imgEl.crossOrigin = 'anonymous';
            await new Promise<void>((res, rej) => {
              imgEl.onload = () => res();
              imgEl.onerror = (e) => rej(e);
              imgEl.src = url;
            });
            const W = Math.max(900, Math.min(1600, imgEl.naturalWidth || 900));
            const H = Math.max(600, Math.min(1200, imgEl.naturalHeight || 600));
            const rc = document.createElement('canvas');
            rc.width = W;
            rc.height = H;
            const rctx = rc.getContext('2d')!;
            rctx.clearRect(0, 0, W, H);
            rctx.drawImage(imgEl, 0, 0, W, H);
            URL.revokeObjectURL(url);
            cache.set(f.id, rc);
            order.push(f.id);
            pruneRasterCacheIfNeeded();
            return rc;
          } catch {
            // fall through to bitmap fallback
          }
        }
      } catch {
        // ignore and fall back to synthesized
      }
    }
  // Do not synthesize stripes here — flags must provide SVGs in public/flags.
  // Return undefined to indicate rasterization is not available.
  return undefined;
  }

  function resetAll(keepFlag: boolean = false) {
    setImageUrl(null);
    try {
      imageBitmapRef.current = null;
    } catch {}
    try {
      if (imgRef.current) {
        // revoke any preview URL
        const prev = (imgRef.current as any)?.dataset?.previewUrl;
        if (prev) URL.revokeObjectURL(prev);
        imgRef.current.src = '';
      }
    } catch {}
    try {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {}
    setImageOffset({ x: 0, y: 0 });
    imageOffsetRef.current = { x: 0, y: 0 };
    setThickness(7);
    setInsetPct(0);
    setBg('transparent');
    setPresentation('ring');
    // clear selected flag (no default) unless caller asked to keep it
    if (!keepFlag) {
      setFlagId('');
      try {
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('bb_selectedFlag');
      } catch {}
    }
  }

  function switchMode(mode: 'image' | 'flag') {
    if (mode === inputMode) return;
    // reset most state when switching modes but keep the selected flag
    resetAll(true);
    setInputMode(mode);
  }

  // Persist selected flag across reloads and keep it in localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      if (flagId) {
        window.localStorage.setItem('bb_selectedFlag', flagId);
      } else {
        window.localStorage.removeItem('bb_selectedFlag');
      }
    } catch {}
  }, [flagId]);

  // Load persisted flag on mount (if present and valid)
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const stored = window.localStorage.getItem('bb_selectedFlag');
      if (stored && !flagId) {
        // only set if not already selected; verify flag exists
        const found = flags.find((f: FlagSpec) => f.id === stored);
        if (found) setFlagId(stored);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFlag = useMemo<FlagSpec | undefined>(
    () => flags.find((f: FlagSpec) => f.id === flagId),
    [flagId],
  );

  // NOTE: buildFlagGradient was moved into `src/flags/utils.ts` and
  // swatches now use the `FlagSwatch` component — keep rasterization
  // and caching centralized via `getRasterizedFlagCanvas` above.

  const presentationEnabled = inputMode === 'image' && Boolean(imageUrl) && Boolean(flagId) && Boolean(selectedFlag);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    try {
      const bmp = await createImageBitmap(f);
      imageBitmapRef.current = bmp;
      // compute clamping bounds and auto-center (use focal point)
      computeBoundsFromImage(bmp);
      const focal = await computeImageFocalPoint(bmp);
      // compute initial offset to bring focal point to center
      const initial = computeOffsetForFocal(bmp, focal);
      const b = boundsRef.current;
      if (b) {
        const v = { x: clamp(initial.x, b.minX, b.maxX), y: clamp(initial.y, b.minY, b.maxY) };
        imageOffsetRef.current = v;
        setImageOffset(v);
      } else {
        imageOffsetRef.current = initial;
        setImageOffset(initial);
      }
    } catch {
      // ignore bitmap creation errors; draw() will still work via fetch(imageUrl)
    }
  }

  function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
  }

  function computeBoundsFromImage(imgBmp: ImageBitmap) {
    const iw = imgBmp.width;
    const ih = imgBmp.height;
    const r = size / 2;
    const base = Math.min(size, size);
    const thicknessPx = Math.round((thickness / 100) * base);
  const padding = Math.round((0 / 100) * base); // paddingPct unused in UI
    const ringOuter = r - Math.max(1, padding);
    const ringInner = Math.max(0, ringOuter - thicknessPx);
    const imageInsetPx = Math.round(((insetPct * -1) / 100) * size);
    const imageRadius = clamp(ringInner - imageInsetPx, 0, r - 0.5);
    const target = imageRadius * 2;
    const scale = Math.max(target / iw, target / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    let minX = imageRadius - dw / 2;
    let maxX = dw / 2 - imageRadius;
    let minY = imageRadius - dh / 2;
    let maxY = dh / 2 - imageRadius;
    // apply safety margin so edges can't reveal any blank areas near the circle
    const marginPx = Math.round(Math.min(24, imageRadius * 0.05));
    minX += marginPx;
    maxX -= marginPx;
    minY += marginPx;
    maxY -= marginPx;
    // ensure bounds valid
    if (minX > maxX) {
      const mid = (minX + maxX) / 2;
      minX = maxX = mid;
    }
    if (minY > maxY) {
      const mid = (minY + maxY) / 2;
      minY = maxY = mid;
    }
    boundsRef.current = { minX, maxX, minY, maxY };
  }

  async function computeImageFocalPoint(imgBmp: ImageBitmap) {
    // Downsample to small canvas to compute luminance centroid
    const w = 128;
    const h = Math.max(32, Math.round((imgBmp.height / imgBmp.width) * w));
    const oc = new OffscreenCanvas(w, h);
    const ctx = oc.getContext('2d')!;
    // draw cover fit into small canvas
    const scale = Math.max(w / imgBmp.width, h / imgBmp.height);
    const dw = imgBmp.width * scale;
    const dh = imgBmp.height * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(imgBmp, dx, dy, dw, dh);
    const data = ctx.getImageData(0, 0, w, h).data;
    let sum = 0;
    let sx = 0;
    let sy = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3] / 255;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) * a + 1e-6;
        sum += lum;
        sx += x * lum;
        sy += y * lum;
      }
    }
    const cx = sx / sum;
    const cy = sy / sum;
    // Map centroid back to original image pixel coordinates
    // invert the drawImage transform
    const fx = clamp((cx - dx) / scale, 0, imgBmp.width);
    const fy = clamp((cy - dy) / scale, 0, imgBmp.height);
    return { x: fx, y: fy };
  }

  function computeOffsetForFocal(imgBmp: ImageBitmap, focal: { x: number; y: number }) {
    const iw = imgBmp.width;
    const ih = imgBmp.height;
    const r = size / 2;
    const base = Math.min(size, size);
    const thicknessPx = Math.round((thickness / 100) * base);
    const padding = Math.round((0 / 100) * base);
    const ringOuter = r - Math.max(1, padding);
    const ringInner = Math.max(0, ringOuter - thicknessPx);
    const imageInsetPx = Math.round(((insetPct * -1) / 100) * size);
    const imageRadius = clamp(ringInner - imageInsetPx, 0, r - 0.5);
    const target = imageRadius * 2;
    const scale = Math.max(target / iw, target / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    // focal in image pixels; compute where focal will be in renderer if offset=0
    // desired: focal maps to canvas center => compute required offset
    const focalRenderX = focal.x * scale; // relative to image left within drawn area
    const focalRenderY = focal.y * scale;
    // when offset = 0, image is centered, so image left = canvasW/2 - dw/2
    // focal absolute = (canvasW/2 - dw/2) + focalRenderX
    // to move focal to canvas center, need offsetX such that
    // (canvasW/2 + offsetX) - dw/2 + focalRenderX = canvasW/2
    // => offsetX = dw/2 - focalRenderX
    const offsetX = dw / 2 - focalRenderX;
    const offsetY = dh / 2 - focalRenderY;
    return { x: Math.round(offsetX), y: Math.round(offsetY) };
  }

  // Allow keyboard nudging of the image when the preview canvas is focused.
  function handleCanvasKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (!imageUrl) return;
    const step = e.shiftKey ? 20 : 5;
    let dx = 0;
    let dy = 0;
    switch (e.key) {
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      case 'ArrowUp':
        dy = -step;
        break;
      case 'ArrowDown':
        dy = step;
        break;
      case 'Home': {
        const b = boundsRef.current;
        if (b) {
          const v = { x: b.minX, y: imageOffsetRef.current.y };
          imageOffsetRef.current = v;
          setImageOffset(v);
        }
        return;
      }
      case 'End': {
        const b = boundsRef.current;
        if (b) {
          const v = { x: b.maxX, y: imageOffsetRef.current.y };
          imageOffsetRef.current = v;
          setImageOffset(v);
        }
        return;
      }
      default:
        return;
    }
    const b = boundsRef.current;
    const nx = b ? clamp(imageOffsetRef.current.x + dx, b.minX, b.maxX) : imageOffsetRef.current.x + dx;
    const ny = b ? clamp(imageOffsetRef.current.y + dy, b.minY, b.maxY) : imageOffsetRef.current.y + dy;
    const v = { x: nx, y: ny };
    imageOffsetRef.current = v;
    setImageOffset(v);
    e.preventDefault();
  }

  async function draw() {
  // If user is in flag mode (no uploaded image) but a flag is selected,
  // draw a full-bleed flag preview into the preview canvas so users can
  // see the flag filling the square preview area.
  if (inputMode === 'flag' && selectedFlag && canvasRef.current) {
      const c = canvasRef.current;
      const ctx = c.getContext('2d')!;
      c.width = size;
      c.height = size;
      ctx.clearRect(0, 0, size, size);
      try {
        // Prefer rasterizing the SVG via createImageBitmap(blob) so the
        // browser's SVG rasterization respects the viewBox/preserveAspectRatio
        // and yields a faithful image which we then cover-crop into the
        // square preview. Fall back to cached rasterized canvas or
        // synthesized stripe rendering.
        let sourceCanvas: HTMLCanvasElement | undefined = undefined;
        try {
          const svgFile = (selectedFlag as any).svgFilename;
          if (svgFile) {
            try {
              const resp = await fetch(`/flags/${svgFile}`);
              if (resp.ok) {
                const blob = await resp.blob();
                try {
                  // createImageBitmap(blob) will rasterize the SVG honoring viewBox.
                  const bm = await createImageBitmap(blob);
                  const rc = document.createElement('canvas');
                  rc.width = Math.max(900, bm.width);
                  rc.height = Math.max(600, bm.height);
                  const rctx = rc.getContext('2d')!;
                  rctx.clearRect(0, 0, rc.width, rc.height);
                  rctx.drawImage(bm as any, 0, 0, rc.width, rc.height);
                  sourceCanvas = rc;
                } catch {
                  // fall back to cached rasterized canvas below
                  sourceCanvas = undefined;
                }
              }
            } catch {
              // ignore and fall back
            }
          }
        } catch {
          // ignore
        }

        if (!sourceCanvas) {
          // No SVG or cached raster available — per policy flags must exist in public/flags.
          // Surface an explicit preview error to the user instead of synthesizing.
          try { setFlagPreviewError('Flag SVG not found or failed to rasterize. Ensure the flag SVG exists in public/flags.'); } catch {}
          try { setFlagImgFallback(true); } catch {}
        } else {
          // draw the source canvas into the square preview canvas using cover scaling
          const sw = sourceCanvas.width;
          const sh = sourceCanvas.height;
          const scale = Math.max(size / sw, size / sh);
          const dw = Math.round(sw * scale);
          const dh = Math.round(sh * scale);
          const dx = Math.round((size - dw) / 2);
          const dy = Math.round((size - dh) / 2);
          ctx.drawImage(sourceCanvas, dx, dy, dw, dh);
          try { setFlagImgFallback(false); } catch {}
          try { setFlagPreviewError(null); } catch {}
        }
      } catch {
        // ignore synthesis errors and leave canvas blank
        try { setFlagImgFallback(true); } catch {}
        try { setFlagPreviewError('Error rendering flag preview'); } catch {}
      }
      return;
  }

  if (!imageUrl || !selectedFlag || !canvasRef.current) return;
  // rendering state intentionally omitted for simplicity
  devLog('[draw] start', { imageUrl, presentation, flagId });
    // Try to decode the uploaded image reliably. Some headless environments
    // (and some image blobs) can cause createImageBitmap(blob) to throw a
    // DOMException: "The source image could not be decoded." Wrap and
    // fallback to an HTMLImageElement load, then createImageBitmap from that.
    let img: ImageBitmap;
    try {
      // Fetch blob first so we can log diagnostics if decoding fails
      const fetched = await fetch(imageUrl);
      const blob = await fetched.blob();
      try {
        img = await createImageBitmap(blob);
      } catch (err) {
  devLog('[draw] createImageBitmap(blob) failed — blob info:', { size: (blob as any).size, type: blob.type }, err && ((err as any).stack || err));
        throw err;
      }
    } catch (err) {
  devLog('[draw] createImageBitmap(blob) failed, falling back to HTMLImage decode', err && ((err as any).stack || err));
      try {
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => {
          imgEl.onload = () => res();
          imgEl.onerror = (e) => rej(e);
          imgEl.src = imageUrl as string;
        });
        img = await createImageBitmap(imgEl);
      } catch (err2) {
        devLog('[draw] createImageBitmap from HTMLImage failed, using 1x1 transparent fallback', err2);
        // Final fallback: 1x1 transparent canvas -> ImageBitmap so renderer can still run
        const oc = document.createElement('canvas');
        oc.width = 1;
        oc.height = 1;
        const octx = oc.getContext('2d')!;
        octx.clearRect(0, 0, 1, 1);
        img = await createImageBitmap(oc as any);
      }
    }
  // Optionally load or synthesize an image to use as the border (cutout presentation)
    let borderImageBitmap: ImageBitmap | undefined = undefined;
    function devLog(...args: any[]) {
      try {
        // Prefer Vite's import.meta.env.DEV when available; fall back to NODE_ENV check in Node.
        const viteDev = typeof (import.meta as any) !== 'undefined' && !!(import.meta as any).env?.DEV;
        const nodeDev = typeof process !== 'undefined' && !!(process.env && process.env.NODE_ENV !== 'production');
        if (viteDev || nodeDev) {
          // eslint-disable-next-line no-console
          console.log(...args);
        }
      } catch {}
    }

  // Deterministic SVG lookup for cutout: prefer a cached rasterized canvas
  if (presentation === 'cutout') {
    try {
      const rc = await getRasterizedFlagCanvas(selectedFlag);
      if (rc) {
        try {
          borderImageBitmap = await createImageBitmap(rc as any);
          devLog('[cutout] used cached rasterized canvas for borderImageBitmap', borderImageBitmap?.width, borderImageBitmap?.height);
        } catch (err) {
          devLog('[cutout] createImageBitmap from cached canvas failed', err);
          borderImageBitmap = undefined;
        }

        // Sanity-check the bitmap to ensure it's not completely transparent
        try {
          if (borderImageBitmap) {
            const sample = Math.max(32, Math.min(256, Math.floor(Math.min(borderImageBitmap.width, borderImageBitmap.height, 256))));
            const checkCanvas = document.createElement('canvas');
            checkCanvas.width = sample;
            checkCanvas.height = sample;
            const cctx = checkCanvas.getContext('2d')!;
            cctx.clearRect(0, 0, sample, sample);
            cctx.drawImage(borderImageBitmap, 0, 0, sample, sample);
            const id = cctx.getImageData(0, 0, sample, sample).data;
            let anyOpaque = false;
            for (let i = 3; i < id.length; i += 4) {
              if (id[i] > 16) { anyOpaque = true; break; }
            }
            if (!anyOpaque) {
              devLog('[cutout] SVG bitmap appears empty/transparent at sample size', sample, 'discarding to use synthesized fallback');
              borderImageBitmap = undefined;
            } else {
              devLog('[cutout] SVG bitmap sanity-check PASSED (has opaque pixels) at sample', sample);
            }
          }
        } catch (err) {
          devLog('[cutout] bitmap sanity-check failed', err);
        }
      }
    } catch (err) {
      devLog('[cutout] getRasterizedFlagCanvas failed', err);
    }
  }

  // If cutout requested but no SVG available, synthesize a rectangular flag bitmap from the stripe data
  if (!borderImageBitmap && presentation === 'cutout' && selectedFlag) {
        // Create a canvas representing the full flag (landscape aspect). Use 3:2 as a reasonable default.
        const FLAG_W = 900;
        const FLAG_H = 600;
        const flagCanvas = document.createElement('canvas');
        flagCanvas.width = FLAG_W;
        flagCanvas.height = FLAG_H;
        const fctx = flagCanvas.getContext('2d')!;
        // Draw background white first
        fctx.clearRect(0, 0, FLAG_W, FLAG_H);

        const stripes = selectedFlag.pattern.stripes;
        const total = stripes.reduce((s, x) => s + x.weight, 0);

        if (selectedFlag.pattern.orientation === 'horizontal') {
          // Draw top->bottom stripes
          let y = 0;
          for (const s of stripes) {
            const hpx = Math.max(1, Math.round((s.weight / total) * FLAG_H));
            fctx.fillStyle = s.color;
            fctx.fillRect(0, y, FLAG_W, hpx);
            y += hpx;
          }
          if (y < FLAG_H) {
            fctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000';
            fctx.fillRect(0, y, FLAG_W - 0, FLAG_H - y);
          }
        } else {
          // vertical orientation: draw left->right
          let x = 0;
          for (const s of stripes) {
            const wpx = Math.max(1, Math.round((s.weight / total) * FLAG_W));
            fctx.fillStyle = s.color;
            fctx.fillRect(x, 0, wpx, FLAG_H);
            x += wpx;
          }
          if (x < FLAG_W) {
            fctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000';
            fctx.fillRect(x, 0, FLAG_W - x, FLAG_H);
          }
        }

        try {
          borderImageBitmap = await createImageBitmap(flagCanvas);
          devLog('[cutout] synthesized borderImageBitmap', borderImageBitmap?.width, borderImageBitmap?.height);
        } catch (err) {
          devLog('[cutout] failed to create bitmap from synthesized flag', err);
          // ignore and fall back to renderer-generated stripes
          borderImageBitmap = undefined;
        }
      }
    // Inset (+) should increase the gap (smaller image radius), Outset (-) reduces it.
    // Renderer interprets positive imageInsetPx as increasing gap, so negate here if current behavior is reversed.
    const imageInsetPx = Math.round(((insetPct * -1) / 100) * size);
    const blob = await renderAvatar(img, selectedFlag, {
      size,
      thicknessPct: thickness,
      imageInsetPx,
      imageOffsetPx: { x: Math.round(imageOffset.x), y: Math.round(imageOffset.y) },
      presentation,
      backgroundColor: bg === 'transparent' ? null : bg,
  borderImageBitmap: borderImageBitmap as any,
    });
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    c.width = size;
    c.height = size;
    ctx.clearRect(0, 0, size, size);
  // wrapper provides checkerboard when bg === 'transparent'

    // Create blob URL and set it on the overlay <img> so transparency reveals the checkerboard.
    const blobUrl = URL.createObjectURL(blob);
    try {
      // Revoke previous blob URL if present on img
      const prev = (imgRef.current as any)?.dataset?.previewUrl;
      if (prev) URL.revokeObjectURL(prev);
    } catch {
      // ignore
    }
    if (imgRef.current) {
      imgRef.current.src = blobUrl;
      try {
        (imgRef.current as any).dataset.previewUrl = blobUrl;
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    // Auto-apply whenever inputs change
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, flagId, thickness, size, insetPct, bg, imageOffset.x, imageOffset.y, presentation]);

  // Pointer handlers for dragging the image within the crop
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const setOffset = (nx: number, ny: number) => {
      imageOffsetRef.current = { x: nx, y: ny };
      setImageOffset({ x: nx, y: ny });
    };

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture?.(e.pointerId);
      draggingRef.current = {
        down: true,
        startX: e.clientX,
        startY: e.clientY,
        origX: imageOffsetRef.current.x,
        origY: imageOffsetRef.current.y,
      };
      lastMoveRef.current = { clientX: e.clientX, clientY: e.clientY, t: performance.now() };
      // cancel any running inertia
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };

    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current?.down) return;
      const d = draggingRef.current;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const rect = el.getBoundingClientRect();
      const scale = size / rect.width;
      const ddx = dx * scale;
      const ddy = dy * scale;
      const b = boundsRef.current;
      const rawX = d.origX + ddx;
      const rawY = d.origY + ddy;
      const nx = b ? clamp(rawX, b.minX, b.maxX) : rawX;
      const ny = b ? clamp(rawY, b.minY, b.maxY) : rawY;
      // compute velocity from lastMoveRef (client space) and convert to renderer pixels
      const last = lastMoveRef.current;
      const now = performance.now();
      if (last) {
        const dt = Math.max(8, now - last.t); // ms
        const vxClient = (e.clientX - last.clientX) / dt; // px per ms
        const vyClient = (e.clientY - last.clientY) / dt;
        // convert to internal pixels per frame approximation
        const vx = vxClient * scale * 16.67; // px per ~frame (16.67ms)
        const vy = vyClient * scale * 16.67;
        velocityRef.current = { vx, vy };
      }
      lastMoveRef.current = { clientX: e.clientX, clientY: e.clientY, t: now };
      setOffset(nx, ny);
    };

    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current.down = false;
      // start inertia from the last measured velocity
      const vel = velocityRef.current;
      if (!vel) return;
      let vx = vel.vx;
      let vy = vel.vy;
      const step = () => {
        vx *= 0.92;
        vy *= 0.92;
        if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) {
          if (animRef.current) cancelAnimationFrame(animRef.current);
          animRef.current = null;
          return;
        }
        setImageOffset((cur) => {
          const b = boundsRef.current;
          const nx = cur.x + vx;
          const ny = cur.y + vy;
          const clamped = b ? { x: clamp(nx, b.minX, b.maxX), y: clamp(ny, b.minY, b.maxY) } : { x: nx, y: ny };
          imageOffsetRef.current = clamped;
          return clamped;
        });
        animRef.current = requestAnimationFrame(step);
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(step);
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
    // attach once
  }, []);

  useEffect(() => {
    // Draw checkerboard into the checker canvas when transparent background is selected
    const c = checkerRef.current;
    if (!c) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (bg !== 'transparent') {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    // Checker colours more contrasting for visibility
    const checker1 = theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff';
    const checker2 = theme.palette.mode === 'dark' ? '#14202b' : '#e6e6e6';
    const tile = 18; // CSS tile size used elsewhere

    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const isEven = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = isEven ? checker1 : checker2;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }, [bg, theme.palette.mode]);

  // Recompute bounds when size/thickness/inset change or when an image is present
  useEffect(() => {
    const bmp = imageBitmapRef.current;
    if (!bmp) return;
    computeBoundsFromImage(bmp);
    // clamp current offset into new bounds
    const b = boundsRef.current;
    if (b) setImageOffset((s) => {
      const v = { x: clamp(s.x, b.minX, b.maxX), y: clamp(s.y, b.minY, b.maxY) };
      imageOffsetRef.current = v;
      return v;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thickness, insetPct]);

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5">Beyond Borders</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a circular, flag-colored border to your profile picture.
          </Typography>
        </Box>
        <IconButton
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          color="inherit"
          aria-label="Toggle dark mode"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }} elevation={1}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      <Button
                        component="label"
                        variant={inputMode === 'image' ? 'contained' : 'outlined'}
                        onClick={() => setInputMode('image')}
                        size="small"
                        startIcon={<FileUploadIcon />}
                        sx={{ flex: 1, minWidth: 0 }}
                        aria-pressed={inputMode === 'image'}
                        aria-label="Switch to image mode and upload a file"
                        focusRipple
                        disableElevation
                      >
                        Image mode
                        <input
                          ref={(el) => (fileInputRef.current = el)}
                          hidden
                          accept="image/png, image/jpeg"
                          type="file"
                          onChange={(e) => {
                            onFileChange(e as any);
                            setInputMode('image');
                          }}
                        />
                      </Button>
                      <Box component="span" sx={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>OR</Box>
                      <Button
                        variant={inputMode === 'flag' ? 'contained' : 'outlined'}
                        onClick={() => switchMode('flag')}
                        size="small"
                        sx={{ flex: 1, minWidth: 0 }}
                        aria-pressed={inputMode === 'flag'}
                        aria-label="Switch to flag selection mode"
                        focusRipple
                        disableElevation
                      >
                        Flag mode
                      </Button>
                    </Box>
                  </Stack>

                  {/* removed duplicate file upload button; CHOOSE IMAGE above now handles file input */}
                </Stack>
            </Paper>

            {/* Moved flag selection up so it appears directly after the input controls */}
            <Paper sx={{ p: 2, mt: 2 }} elevation={1}>
              <FormControl fullWidth>
                <InputLabel id="flag-select-label">Select a flag</InputLabel>
                <Select
                  labelId="flag-select-label"
                  value={flagId}
                  label="Select a flag"
                  onChange={(e) => setFlagId(e.target.value as string)}
                  disabled={!(inputMode === 'flag' || Boolean(imageUrl))}
                  inputProps={{ 'aria-label': 'Flag selection' }}
                  renderValue={(val) => {
                    const v = val as string;
                    if (!v) return <em>Choose a flag…</em>;
                    const found = flags.find((ff: FlagSpec) => ff.id === v);
                    if (!found) return v;
                    return <FlagSwatch flag={found} showName />;
                  }}
                >
                  {flags.map((f: FlagSpec) => (
                    <MenuItem key={f.id} value={f.id}>
                      <FlagSwatch flag={f} showName />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>

            <Paper sx={{ p: 2, position: 'relative' }} elevation={1}>
              <Stack
                spacing={2}
                sx={{
                  opacity: presentationEnabled ? 1 : 0.95,
                  pointerEvents: presentationEnabled ? 'auto' : 'none',
                  transition: 'filter 200ms ease, opacity 200ms ease, box-shadow 200ms ease',
                  filter: presentationEnabled ? 'none' : 'grayscale(0.6) brightness(0.92) contrast(0.95)',
                }}
              >
                <FormControl component="fieldset" sx={{ mt: 1 }}>
                  <FormLabel component="legend">Presentation</FormLabel>
                  <RadioGroup
                    row
                    value={presentation}
                    onChange={(e) => setPresentation(e.target.value as any)}
                      aria-label="Presentation style"
                    name="presentation"
                  >
                    <FormControlLabel value="ring" control={<Radio />} label="Ring" disabled={!presentationEnabled} />
                    <FormControlLabel value="segment" control={<Radio />} label="Segment" disabled={!presentationEnabled} />
                    <FormControlLabel value="cutout" control={<Radio />} label="Cutout" disabled={!presentationEnabled} />
                  </RadioGroup>
                </FormControl>

                <Box sx={{ opacity: presentationEnabled ? 1 : 0.6 }}>
                  <Typography gutterBottom>Border thickness: {thickness}%</Typography>
                  <Slider
                    min={5}
                    max={20}
                    value={thickness}
                    onChange={(_, v) => setThickness(v as number)}
                      aria-label="Border thickness"
                    disabled={!presentationEnabled}
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid xs={12}>
                    <Box sx={{ opacity: presentationEnabled ? 1 : 0.6 }}>
                      <Typography variant="body2">Inset/Outset: {insetPct}%</Typography>
                      <Slider
                        min={-5}
                        max={5}
                        value={insetPct}
                        onChange={(_, v) => setInsetPct(v as number)}
                        aria-label="Inset or outset"
                        disabled={!presentationEnabled}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box>
                  <FormControl fullWidth>
                    <InputLabel id="bg-label">Background</InputLabel>
                    <Select
                      labelId="bg-label"
                      value={bg}
                      label="Background"
                      onChange={(e) => setBg(e.target.value as any)}
                      disabled={!presentationEnabled}
                      inputProps={{ 'aria-label': 'Background color' }}
                    >
                      {/* Color preview swatches inside menu items */}
                      <MenuItem value="transparent">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 18,
                              height: 12,
                              border: '1px solid var(--muted-border)',
                              bgcolor: '#fff',
                              backgroundImage:
                                'linear-gradient(45deg,var(--muted-check) 25%, transparent 25%), linear-gradient(-45deg,var(--muted-check) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--muted-check) 75%), linear-gradient(-45deg, transparent 75%, var(--muted-check) 75%)',
                              backgroundSize: '18px 18px',
                              backgroundPosition: '0 0, 0 9px, 9px -9px, -9px 0',
                            }}
                          />
                          <Typography>Transparent</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="#ffffff">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 18,
                              height: 12,
                              border: '1px solid var(--muted-border)',
                              bgcolor: '#ffffff',
                            }}
                          />
                          <Typography>White</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="#000000">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 18,
                              height: 12,
                              border: '1px solid var(--muted-border)',
                              bgcolor: '#000000',
                            }}
                          />
                          <Typography>Black</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="#f5f5f5">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 18,
                              height: 12,
                              border: '1px solid var(--muted-border)',
                              bgcolor: '#f5f5f5',
                            }}
                          />
                          <Typography>Light Gray</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="#111827">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 18,
                              height: 12,
                              border: '1px solid var(--muted-border)',
                              bgcolor: '#111827',
                            }}
                          />
                          <Typography>Slate</Typography>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={async () => {
                        if (!imageUrl || !selectedFlag) return;
                        const img = await createImageBitmap(await (await fetch(imageUrl)).blob());

                        // Try to reuse cached rasterized flag canvas for border if available
                        let borderImageBitmap: ImageBitmap | undefined = undefined;
                        try {
                          const rc = await getRasterizedFlagCanvas(selectedFlag);
                          if (rc) {
                            try {
                              borderImageBitmap = await createImageBitmap(rc as any);
                            } catch {
                              borderImageBitmap = undefined;
                            }
                          }
                        } catch {
                          borderImageBitmap = undefined;
                        }

                        const blob = await renderAvatar(img, selectedFlag, {
                          size,
                          thicknessPct: thickness,
                          imageInsetPx: Math.round(((insetPct * -1) / 100) * size),
                          imageOffsetPx: { x: Math.round(imageOffset.x), y: Math.round(imageOffset.y) },
                          presentation,
                          backgroundColor: bg === 'transparent' ? null : bg,
                          borderImageBitmap: borderImageBitmap as any,
                        });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `beyond-borders_${selectedFlag.id}_${size}.png`;
                        a.click();
                      }}
                      aria-label="Download generated PNG"
                      disabled={!(imageUrl && selectedFlag)}
                    >
                      Download PNG
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const v = { x: 0, y: 0 };
                        imageOffsetRef.current = v;
                        setImageOffset(v);
                      }}
                      disabled={!imageUrl}
                    >
                      Reset position
                    </Button>
                  </Stack>
              </Stack>
              {/* Visual-only disabled state (grayscale / slight darken) -- no overlay text */}
            </Paper>
          </Stack>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper
            sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            elevation={1}
          >
              <Box
                sx={(theme) => ({
                  width: '100%',
                  maxWidth: 360,
                borderRadius: 0, // keep square corners
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // subtle theme-aware border and shadow to feel modern
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: theme.shadows[3],
                // keep background transparent here; the inner square will render the checkerboard
                backgroundColor: 'transparent',
                p: 0,
                position: 'relative',
              })}
            >
              <Box
                sx={(theme) => ({
                  width: '100%',
                  aspectRatio: '1 / 1',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  display: 'block',
                  position: 'relative',
                  // Apply the selected background color (or transparent for checkerboard)
                  backgroundColor: bg === 'transparent' ? 'transparent' : bg,
                  backgroundImage:
                    bg === 'transparent'
                      ? (() => {
                          const checker1 = theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff';
                          const checker2 = theme.palette.mode === 'dark' ? '#1f2937' : '#e6e6e6';
                          return `linear-gradient(45deg,${checker2} 25%, transparent 25%), linear-gradient(-45deg,${checker2} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker2} 75%), linear-gradient(-45deg, transparent 75%, ${checker2} 75%), linear-gradient(45deg,${checker1} 25%, transparent 25%), linear-gradient(-45deg,${checker1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker1} 75%), linear-gradient(-45deg, transparent 75%, ${checker1} 75)`;
                        })()
                      : 'none',
                  backgroundSize: bg === 'transparent' ? '18px 18px' : undefined,
                  backgroundPosition: bg === 'transparent' ? '0 0, 0 9px, 9px -9px, -9px 0, 0 0, 0 9px, 9px -9px, -9px 0' : undefined,
                  border: undefined,
                })}
              >
                <Box
                  component="canvas"
                  ref={canvasRef}
                  width={size}
                  height={size}
                  title={imageUrl ? 'Drag to reposition image. Use arrow keys to nudge when focused.' : undefined}
                  tabIndex={0}
                  role="img"
                  aria-label={imageUrl ? 'Preview canvas. Drag to reposition image. Use arrow keys to nudge.' : 'Preview canvas'}
                  onKeyDown={handleCanvasKeyDown}
                  sx={(theme) => ({
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    borderRadius: 0,
                    // ensure transparent pixels show the checkerboard beneath
                    // Keep the canvas transparent so PNG transparency shows the checkerboard
                    // or the selected background color underneath (set on the container).
                    backgroundColor: bg === 'transparent' ? 'transparent' : bg,
                    backgroundImage:
                      bg === 'transparent'
                        ? (() => {
                            const checker1 = theme.palette.mode === 'dark' ? '#0b1220' : '#ffffff';
                            const checker2 = theme.palette.mode === 'dark' ? '#1f2937' : '#e6e6e6';
                            return `linear-gradient(45deg,${checker2} 25%, transparent 25%), linear-gradient(-45deg,${checker2} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker2} 75%), linear-gradient(-45deg, transparent 75%, ${checker2} 75%), linear-gradient(45deg,${checker1} 25%, transparent 25%), linear-gradient(-45deg,${checker1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checker1} 75%), linear-gradient(-45deg, transparent 75%, ${checker1} 75)`;
                          })()
                        : 'none',
                    backgroundSize: bg === 'transparent' ? '18px 18px' : undefined,
                    backgroundPosition:
                      bg === 'transparent' ? '0 0, 0 9px, 9px -9px, -9px 0, 0 0, 0 9px, 9px -9px, -9px 0' : undefined,
                    objectFit: 'cover',
                    zIndex: 1,
                    transition: 'transform 220ms ease, opacity 180ms ease',
                    cursor: imageUrl ? 'grab' : 'default',
                    touchAction: 'none',
                  })}
                />
                {/* Checkerboard canvas sits under the avatar canvas so transparent pixels reveal it */}
                <Box
                  component="canvas"
                  ref={checkerRef}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />
                  {/* Overlay img to display generated PNG so transparency reveals checkerboard */}
                  <Box
                    component="img"
                    ref={imgRef}
                    sx={(_theme) => ({
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      zIndex: 10,
                      display: imageUrl ? 'block' : 'none',
                    })}
                  />
                  {/* Error overlay when flag preview cannot render */}
                  {flagPreviewError ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20,
                        pointerEvents: 'none',
                      }}
                    >
                      <Box
                        sx={(t) => ({
                          bgcolor: t.palette.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                          color: t.palette.mode === 'dark' ? '#fff' : '#111',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          boxShadow: t.shadows[3],
                          fontSize: 12,
                          maxWidth: '90%',
                          textAlign: 'center',
                        })}
                      >
                        {flagPreviewError}
                      </Box>
                    </Box>
                  ) : null}
                  {/* Flag-mode preview: show the SVG (or raster fallback) as an <img> that covers the box for a crisp preview */}
                  <Box
                    component="img"
                    ref={flagPreviewImgRef}
                    src={inputMode === 'flag' && selectedFlag ? ((selectedFlag as any).svgFilename ? `/flags/${(selectedFlag as any).svgFilename}` : undefined) : undefined}
                    alt={selectedFlag ? selectedFlag.displayName : ''}
                    sx={(theme) => ({
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                      // Only display the overlay image when the fallback flagImgFallback
                      // state is true. When false the canvas rendering should be visible
                      // and the overlay must remain hidden to avoid masking it.
                      zIndex: inputMode === 'flag' && flagImgFallback ? 10 : 0,
                      display: inputMode === 'flag' && !!selectedFlag && flagImgFallback ? 'block' : 'none',
                      // keep lower contrast for non-selected states
                      filter: inputMode === 'flag' && !!selectedFlag ? 'none' : 'grayscale(1)'
                    })}
                    onError={(e: any) => {
                      // hide if SVG failed to load (fallback to canvas synthesis will be used)
                      try { e.currentTarget.style.display = 'none'; } catch {}
                    }}
                  />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
