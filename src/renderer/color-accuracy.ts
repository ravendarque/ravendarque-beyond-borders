/**
 * Color accuracy utilities for testing and validation
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 * @param hex Hex color string (e.g., '#FF0000' or '#F00')
 * @returns RGB object with values 0-255
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Expand shorthand (e.g., 'F00' to 'FF0000')
  const expanded = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
  
  if (expanded.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  
  return { r, g, b };
}

/**
 * Convert RGB to hex color
 * @param r Red value (0-255)
 * @param g Green value (0-255)
 * @param b Blue value (0-255)
 * @returns Hex color string (e.g., '#FF0000')
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0').toUpperCase();
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate Euclidean distance between two colors
 * @param c1 First color
 * @param c2 Second color
 * @returns Distance value (0 = identical, higher = more different)
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Check if two colors are within tolerance
 * @param c1 First color (hex or RGB)
 * @param c2 Second color (hex or RGB)
 * @param tolerance RGB tolerance per channel (default: 1)
 * @returns True if colors are within tolerance
 */
export function colorsMatch(
  c1: string | RGB,
  c2: string | RGB,
  tolerance = 1
): boolean {
  const rgb1 = typeof c1 === 'string' ? hexToRgb(c1) : c1;
  const rgb2 = typeof c2 === 'string' ? hexToRgb(c2) : c2;
  
  return (
    Math.abs(rgb1.r - rgb2.r) <= tolerance &&
    Math.abs(rgb1.g - rgb2.g) <= tolerance &&
    Math.abs(rgb1.b - rgb2.b) <= tolerance
  );
}

/**
 * Sample pixel color from canvas at given coordinates
 * @param ctx Canvas 2D context
 * @param x X coordinate
 * @param y Y coordinate
 * @returns RGB color at that pixel
 */
export function samplePixel(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number
): RGB {
  const imageData = ctx.getImageData(x, y, 1, 1);
  return {
    r: imageData.data[0],
    g: imageData.data[1],
    b: imageData.data[2],
  };
}

/**
 * Sample multiple pixels and return average color
 * @param ctx Canvas 2D context
 * @param points Array of [x, y] coordinates
 * @returns Average RGB color
 */
export function samplePixelsAverage(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  points: Array<[number, number]>
): RGB {
  if (points.length === 0) {
    throw new Error('No points provided for sampling');
  }
  
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  
  for (const [x, y] of points) {
    const color = samplePixel(ctx, x, y);
    totalR += color.r;
    totalG += color.g;
    totalB += color.b;
  }
  
  return {
    r: Math.round(totalR / points.length),
    g: Math.round(totalG / points.length),
    b: Math.round(totalB / points.length),
  };
}

/**
 * Generate sampling points for a stripe in a circular border
 * @param center Canvas center coordinate
 * @param innerRadius Inner radius of the ring
 * @param outerRadius Outer radius of the ring
 * @param stripeStartRadius Start radius of this stripe
 * @param stripeEndRadius End radius of this stripe
 * @param numSamples Number of sample points to generate
 * @returns Array of [x, y] coordinates
 */
export function generateStripeSamplePoints(
  center: number,
  innerRadius: number,
  outerRadius: number,
  stripeStartRadius: number,
  stripeEndRadius: number,
  numSamples = 8
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const midRadius = (stripeStartRadius + stripeEndRadius) / 2;
  
  // Sample at multiple angles around the circle
  for (let i = 0; i < numSamples; i++) {
    const angle = (Math.PI * 2 * i) / numSamples;
    const x = Math.round(center + midRadius * Math.cos(angle));
    const y = Math.round(center + midRadius * Math.sin(angle));
    points.push([x, y]);
  }
  
  return points;
}

/**
 * Color accuracy test result
 */
export interface ColorTestResult {
  /** Flag ID being tested */
  flagId: string;
  /** Stripe index */
  stripeIndex: number;
  /** Expected color (from specification) */
  expected: RGB;
  /** Actual color (sampled from render) */
  actual: RGB;
  /** Distance between colors */
  distance: number;
  /** Whether colors match within tolerance */
  matches: boolean;
  /** Tolerance used for comparison */
  tolerance: number;
}

/**
 * Test a single stripe color accuracy
 * @param ctx Canvas context with rendered flag
 * @param center Canvas center coordinate
 * @param stripeStartRadius Start radius of stripe
 * @param stripeEndRadius End radius of stripe
 * @param expectedColor Expected hex color
 * @param flagId Flag ID for reporting
 * @param stripeIndex Stripe index for reporting
 * @param tolerance RGB tolerance (default: 1)
 * @returns Color test result
 */
export function testStripeColor(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  center: number,
  stripeStartRadius: number,
  stripeEndRadius: number,
  expectedColor: string,
  flagId: string,
  stripeIndex: number,
  tolerance = 1
): ColorTestResult {
  // Generate sample points in the middle of the stripe
  const points = generateStripeSamplePoints(
    center,
    stripeStartRadius,
    stripeEndRadius,
    stripeStartRadius,
    stripeEndRadius,
    8
  );
  
  // Sample actual color
  const actual = samplePixelsAverage(ctx, points);
  const expected = hexToRgb(expectedColor);
  const distance = colorDistance(actual, expected);
  const matches = colorsMatch(actual, expected, tolerance);
  
  return {
    flagId,
    stripeIndex,
    expected,
    actual,
    distance,
    matches,
    tolerance,
  };
}

/**
 * Format color test result as human-readable string
 */
export function formatColorTestResult(result: ColorTestResult): string {
  const status = result.matches ? '✅ PASS' : '❌ FAIL';
  const expectedHex = rgbToHex(result.expected.r, result.expected.g, result.expected.b);
  const actualHex = rgbToHex(result.actual.r, result.actual.g, result.actual.b);
  
  return (
    `${status} ${result.flagId} stripe ${result.stripeIndex}: ` +
    `Expected ${expectedHex} (${result.expected.r},${result.expected.g},${result.expected.b}), ` +
    `Got ${actualHex} (${result.actual.r},${result.actual.g},${result.actual.b}), ` +
    `Distance: ${result.distance.toFixed(2)}`
  );
}

/**
 * Official flag color specifications for testing
 */
export const OFFICIAL_FLAG_COLORS: Record<string, string[]> = {
  'trans-pride': [
    '#5BCEFA', // Light blue
    '#F5A9B8', // Light pink
    '#FFFFFF', // White
    '#F5A9B8', // Light pink
    '#5BCEFA', // Light blue
  ],
  'progress-pride-simplified': [
    '#E40303', // Red
    '#FF8C00', // Orange
    '#FFED00', // Yellow
    '#008026', // Green
    '#004DFF', // Blue
    '#750787', // Violet
  ],
  'non-binary': [
    '#FFF430', // Yellow
    '#FFFFFF', // White
    '#9C59D1', // Purple
    '#2C2C2C', // Black
  ],
  'bisexual': [
    '#D60270', // Magenta
    '#D60270', // Magenta (wider stripe)
    '#9B4F96', // Purple
    '#0038A8', // Blue
    '#0038A8', // Blue (wider stripe)
  ],
  'lesbian': [
    '#D62900', // Dark orange
    '#FF9B55', // Orange
    '#FFFFFF', // White
    '#D461A6', // Pink
    '#A50062', // Dark rose
  ],
  'pansexual': [
    '#FF218C', // Magenta
    '#FFD800', // Yellow
    '#21B1FF', // Cyan
  ],
  'asexual': [
    '#000000', // Black
    '#A3A3A3', // Gray
    '#FFFFFF', // White
    '#800080', // Purple
  ],
};
