import type { FlagSpec } from './schema';

export function buildFlagGradient(f: FlagSpec) {
  try {
    const colors = f.modes?.ring?.colors ?? [];
    if (colors.length === 0) return undefined;
    const total = colors.length;
    const stops: string[] = [];
    let acc = 0;
    for (const color of colors) {
      const pct = (1 / total) * 100;
      const start = acc;
      acc += pct;
      const end = acc;
      stops.push(`${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
    }
    return `linear-gradient(180deg, ${stops.join(', ')})`;
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
  const colors = f.modes?.ring?.colors ?? [];
  if (colors.length === 0) return canvas;
  const total = colors.length;
  // Always draw horizontal stripes
  let y = 0;
  for (const color of colors) {
    const hpx = Math.max(1, Math.round((1 / total) * height));
    ctx.fillStyle = color;
    ctx.fillRect(0, y, width, hpx);
    y += hpx;
  }
  if (y < height) {
    ctx.fillStyle = colors[colors.length - 1] ?? '#000';
    ctx.fillRect(0, y, width, height - y);
  }
  return canvas;
}
