export type FlagMeta = {
  id: string;
  displayName: string;
  svgFilename?: string | null;
  png_full?: string | null;
  png_preview?: string | null;
  source_page?: string | null;
  media_url?: string | null;
  description?: string | null;
  type?: string | null;
  reason?: string | null;
  link?: string | null;
  colors?: string[] | null;
  size?: number | null;
  stripe_order?: any;
};

let cached: FlagMeta[] | null = null;

export async function loadFlags(): Promise<FlagMeta[]> {
  if (cached) return cached;
  try {
    const resp = await fetch('/flags/flags.json');
    if (!resp.ok) throw new Error('Failed to load flags.json');
    const j = await resp.json();
    if (!Array.isArray(j)) throw new Error('flags.json did not contain an array');
    cached = j as FlagMeta[];
    return cached;
  } catch (e) {
    console.warn('loadFlags failed', e && (e as any).message);
    return [];
  }
}

export function getFlagById(id: string): FlagMeta | undefined {
  if (!cached) return undefined;
  return cached.find((f) => f.id === id);
}
