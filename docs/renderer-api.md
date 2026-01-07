# Renderer API Documentation

## Overview

The renderer module (`src/renderer/render.ts`) provides the core avatar
rendering functionality with flag-themed borders. It supports three
presentation modes: **ring**, **segment**, and **cutout**.

---

## Main Function

### `renderAvatar(image, flag, options)`

Renders an avatar with a flag-themed border.

**Parameters:**

- `image: ImageBitmap` - The user's image to render
- `flag: FlagSpec` - Flag specification with colors, pattern, and metadata
- `options: RenderOptions` - Rendering options (see below)

**Returns:** `Promise<Blob>` - The rendered PNG image as a Blob

---

## RenderOptions Interface

### Required Options

#### `size: 512 | 1024`

Output image size in pixels (square).

#### `thicknessPct: number`

Border thickness as percentage of canvas size (typically 5-20).

---

### Optional Options

#### `paddingPct?: number`

Padding around the outer edge as percentage of canvas size.

**Default:** `0`

---

#### `imageOffsetPx?: { x: number; y: number }`

Offset to apply to the user's image center in **ring/segment modes** (pixels).

**Use case:** Fine-tune image centering when the subject is off-center.

**Note:** Not used in cutout mode - use `flagOffsetPx` instead.

**Default:** `{ x: 0, y: 0 }`

**Example:**

```typescript
// Shift user image 20px right, 10px down in ring mode
imageOffsetPx: { x: 20, y: 10 }
```

---

#### `flagOffsetPx?: { x: number; y: number }`

Offset to apply to flag pattern in **cutout mode** (pixels).

**Use case:** Shift the flag pattern left/right to align with specific features.

**Note:** Only applies when `presentation` is `'cutout'`.

**Default:** `{ x: 0, y: 0 }`

**Example:**

```typescript
// Shift flag pattern 50px to the right in cutout mode
flagOffsetPx: { x: 50, y: 0 }
```

---

#### `borderImageBitmap?: ImageBitmap`

Pre-rendered flag image (PNG) for accurate flag rendering.

**Use case:** Provides pixel-perfect flag representation instead of generated stripes.

**Default:** `undefined` (uses generated stripes from pattern)

---

#### `presentation?: 'ring' | 'segment' | 'cutout'`

Border presentation style:

- **`'ring'`**: Concentric circles (horizontal stripes)
- **`'segment'`**: Radial segments (vertical/angular stripes)
- **`'cutout'`**: User image in center, flag in border ring area

**Default:** Determined by flag's pattern orientation

---

#### `backgroundColor?: string | null`

Background color for the canvas.

- **String:** Any valid CSS color (`'#ffffff'`, `'rgb(255,255,255)'`)
- **`null`**: Transparent background

**Default:** `null` (transparent)

---

#### `outerStroke?: { color: string; widthPx: number }`

Optional stroke around the outer edge.

**Example:**

```typescript
outerStroke: { color: '#000000', widthPx: 2 }
```

---

#### `enablePerformanceTracking?: boolean`

Enable performance metrics logging.

**Default:** `true` in development, `false` in production

---

#### `enableDownsampling?: boolean`

Enable automatic image downsampling for large images (improves performance).

**Default:** `true`

**Note:** Large images (>4x output size) are automatically downsampled for
faster rendering.

---

#### `onProgress?: (progress: number) => void`

Progress callback for loading indicators.

**Parameters:**

- `progress: number` - Progress value from 0 to 1

**Example:**

```typescript
onProgress: (progress) => {
  console.log(`Rendering: ${Math.round(progress * 100)}%`);
}
```

---

#### `pngQuality?: number`

PNG compression quality (0-1, higher = better quality but larger file).

**Default:** `0.92` (optimal balance between quality and file size)

**Use case:** Reduce file size for social media uploads or storage constraints.

**Note:** PNG compression is lossless, but this setting affects encoding
efficiency and final file size. Values below 0.8 may produce noticeably
larger files due to less efficient compression.

**Example:**

```typescript
// High quality, larger file size
pngQuality: 0.95

// Balanced (default)
pngQuality: 0.92

// Smaller file size, still good quality
pngQuality: 0.85
```

---

## Return Value: RenderResult

The `renderAvatar` function returns a `RenderResult` object containing:

```typescript
interface RenderResult {
  blob: Blob;              // The rendered image as a Blob
  sizeBytes: number;       // Actual file size in bytes
  sizeKB: string;          // File size in KB (formatted, e.g., "156.23")
  metrics?: RenderMetrics; // Performance metrics (if tracking enabled)
}
```

**Usage:**

```typescript
const result = await renderAvatar(image, flag, options);

// Use the blob for download/display
const url = URL.createObjectURL(result.blob);

// Display file size to user
console.log(`Export size: ${result.sizeKB} KB`);

// Check if file is too large
if (result.sizeBytes > 500 * 1024) {
  console.warn('File is larger than 500 KB');
}
```

---

## Usage Examples

### Example 1: Ring Mode with Background

```typescript
import { renderAvatar } from '@/renderer/render';

const result = await renderAvatar(userImage, palestineFlag, {
  size: 1024,
  thicknessPct: 15,
  presentation: 'ring',
  backgroundColor: '#ffffff'
});

console.log(`Export size: ${result.sizeKB} KB`); // e.g., "156.23 KB"
const url = URL.createObjectURL(result.blob);
```

---

### Example 2: Cutout Mode with Flag Offset

```typescript
const result = await renderAvatar(userImage, kurdistanFlag, {
  size: 1024,
  thicknessPct: 20,
  presentation: 'cutout',
  flagOffsetPx: { x: 50, y: 0 }, // Shift flag pattern right
  borderImageBitmap: flagPNG, // Use pre-rendered flag PNG
  backgroundColor: null // Transparent background
});

// Check file size before uploading
if (result.sizeBytes > 500 * 1024) {
  console.warn('File larger than 500 KB, consider reducing quality');
}
```

---

### Example 3: Segment Mode with Progress Tracking

```typescript
const result = await renderAvatar(userImage, ukraineFlag, {
  size: 512,
  thicknessPct: 12,
  presentation: 'segment',
  onProgress: (progress) => {
    updateProgressBar(progress * 100);
  }
});

// Display file size to user
showMessage(`Avatar created successfully! Size: ${result.sizeKB} KB`);
```

---

### Example 4: Optimized Export for Social Media

```typescript
// Optimize for smaller file size with custom compression
const result = await renderAvatar(userImage, tibetFlag, {
  size: 1024,
  thicknessPct: 15,
  presentation: 'ring',
  pngQuality: 0.85, // Reduce quality slightly for smaller file
  imageOffsetPx: { x: -20, y: 10 } // Fine-tune image position
});

console.log(
  `Optimized size: ${result.sizeKB} KB (${result.sizeBytes.toLocaleString()} bytes)`
);
// Typical output: "Optimized size: 128.45 KB (131,532 bytes)"
```

---

## API Migration Guide

### Breaking Changes (v0.1.0)

#### `imageOffsetPx` behavior clarified

**Before:**

- `imageOffsetPx` was overloaded - used for both image offset and flag offset

**After:**

- **`imageOffsetPx`**: User image offset in ring/segment modes
- **`flagOffsetPx`**: Flag pattern offset in cutout mode

**Migration:**

```typescript
// OLD (cutout mode)
renderAvatar(image, flag, {
  presentation: 'cutout',
  imageOffsetPx: { x: 50, y: 0 } // Used for flag offset (confusing!)
});

// NEW (cutout mode)
renderAvatar(image, flag, {
  presentation: 'cutout',
  flagOffsetPx: { x: 50, y: 0 } // Clearer intent
});
```

**Backward Compatibility:**
The old `imageOffsetPx` in cutout mode still works (falls back to
`flagOffsetPx`), but using `flagOffsetPx` is recommended for clarity.

---

## Performance Considerations

### Automatic Downsampling

Large images (>4x output size) are automatically downsampled before rendering:

- **2-3x faster rendering**
- **~75% memory reduction**
- **No visible quality loss**

**Example:**

- Input: 8000x6000px image
- Output: 1024x1024px avatar
- Downsampled to: 4096x3072px (4x output size)

### Performance Tracking

Enable performance tracking to identify bottlenecks:

```typescript
const blob = await renderAvatar(userImage, flag, {
  size: 1024,
  thicknessPct: 15,
  enablePerformanceTracking: true
});

// Check console for metrics:
// - imageDownsampled: 45ms
// - imageLoaded: 50ms
// - imageDraw: 120ms
// - borderDraw: 180ms
// - total: 400ms
```

---

## Type Definitions

```typescript
interface RenderOptions {
  size: 512 | 1024;
  thicknessPct: number;
  paddingPct?: number;
  outerStroke?: { color: string; widthPx: number };
  imageOffsetPx?: { x: number; y: number };
  flagOffsetPx?: { x: number; y: number };
  borderImageBitmap?: ImageBitmap | undefined;
  presentation?: 'ring' | 'segment' | 'cutout';
  backgroundColor?: string | null;
  enablePerformanceTracking?: boolean;
  enableDownsampling?: boolean;
  onProgress?: (progress: number) => void;
}

interface RenderResult {
  blob: Blob;
  metrics?: RenderMetrics;
}
```

---

## Error Handling

The renderer validates flag patterns before rendering and throws `RenderError`
for invalid inputs:

```typescript
import { RenderError } from '@/types/errors';

try {
  const blob = await renderAvatar(userImage, flag, options);
} catch (error) {
  if (error instanceof RenderError) {
    console.error('Rendering failed:', error.message);
    // Handle rendering error (invalid pattern, etc.)
  }
}
```

---

## Testing

See `src/renderer/__tests__/` for unit tests and examples.

---

## See Also

- [Flag Schema Documentation](./flag-schema.md)
- [Performance Optimization Guide](./performance.md)
- [Testing Guide](./testing.md)
