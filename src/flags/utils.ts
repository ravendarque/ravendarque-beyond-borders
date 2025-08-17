import type { FlagSpec } from './schema';

export function buildFlagGradient(f: FlagSpec) {
  try {
    const stripes = f.pattern?.stripes ?? [];
    const total = stripes.reduce((s, x) => s + x.weight, 0) || 1;
    const stops: string[] = [];
    let acc = 0;
    for (const s of stripes) {
      const pct = (s.weight / total) * 100;
      const start = acc;
      acc += pct;
      const end = acc;
      stops.push(`${s.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
    }
    const dir = (f.pattern?.orientation === 'vertical') ? '90deg' : '180deg';
    return `linear-gradient(${dir}, ${stops.join(', ')})`;
  } catch {
    return undefined;
  }
}

export async function synthesizeFlagCanvas(f: FlagSpec, width = 900, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);
  const stripes = f.pattern?.stripes ?? [];
  const total = stripes.reduce((s, x) => s + x.weight, 0) || 1;
  if (f.pattern?.orientation === 'horizontal') {
    let y = 0;
    for (const s of stripes) {
      const hpx = Math.max(1, Math.round((s.weight / total) * height));
      ctx.fillStyle = s.color;
      ctx.fillRect(0, y, width, hpx);
      y += hpx;
    }
    if (y < height) {
      ctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000';
      ctx.fillRect(0, y, width - 0, height - y);
    }
  } else {
    let x = 0;
    for (const s of stripes) {
      const wpx = Math.max(1, Math.round((s.weight / total) * width));
      ctx.fillStyle = s.color;
      ctx.fillRect(x, 0, wpx, height);
      x += wpx;
    }
    if (x < width) {
      ctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000';
      ctx.fillRect(x, 0, width - x, height);
    }
  }
  return canvas;
}
