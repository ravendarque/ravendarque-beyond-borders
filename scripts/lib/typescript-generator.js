/**
 * TypeScript code generation utilities
 * Generates the flags.ts file from processed flag metadata
 */

/**
 * Generate TypeScript source code for flags array
 * @param {Array} manifest - Array of flag metadata objects
 * @returns {string} - TypeScript source code
 */
export function generateTypeScriptSource(manifest) {
  const lines = [
    "import { FlagSpec } from './schema';",
    '',
    '/**',
    ' * Flag definitions generated from flag-data.yaml',
    ' * Do not edit manually - run scripts/fetch-flags.js to regenerate',
    ' */',
    'export const flags: FlagSpec[] = [',
  ];

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const isLast = i === manifest.length - 1;

    lines.push('  {');
    lines.push(`    id: '${entry.id}',`);
    lines.push(`    name: '${(entry.name || entry.displayName).replace(/'/g, "\\'")}',`);
    
    if (entry.displayName) {
      lines.push(`    displayName: '${entry.displayName.replace(/'/g, "\\'")}',`);
    }
    
    if (entry.png_full) {
      lines.push(`    png_full: '${entry.png_full}',`);
    }
    
    if (entry.png_preview) {
      lines.push(`    png_preview: '${entry.png_preview}',`);
    }
    
    if (entry.aspectRatio !== null && entry.aspectRatio !== undefined) {
      lines.push(`    aspectRatio: ${entry.aspectRatio},`);
    }
    
    if (entry.svgFilename) {
      lines.push(`    svgFilename: '${entry.svgFilename}',`);
    }
    
    if (entry.category) {
      lines.push(`    category: '${entry.category}',`);
    }
    
    if (entry.categoryDisplayName) {
      lines.push(`    categoryDisplayName: '${entry.categoryDisplayName.replace(/'/g, "\\'")}',`);
    }
    
    if (entry.categoryDisplayOrder !== null && entry.categoryDisplayOrder !== undefined) {
      lines.push(`    categoryDisplayOrder: ${entry.categoryDisplayOrder},`);
    }
    
    if (entry.reason) {
      lines.push(`    reason: '${entry.reason.replace(/'/g, "\\'")}',`);
    }
    
    // Generate references field
    if (entry.references && Array.isArray(entry.references) && entry.references.length > 0) {
      lines.push('    references: [');
      for (let j = 0; j < entry.references.length; j++) {
        const ref = entry.references[j];
        const isLastRef = j === entry.references.length - 1;
        lines.push('      {');
        lines.push(`        url: '${ref.url.replace(/'/g, "\\'")}',`);
        lines.push(`        text: '${ref.text.replace(/'/g, "\\'")}'${isLastRef ? '' : ','}`);
        lines.push(`      }${isLastRef ? '' : ','}`);
      }
      lines.push('    ],');
    }
    
    // Generate modes object
    const hasModes = entry.cutoutMode || (entry.layouts && entry.layouts.length > 0);
    if (hasModes) {
      lines.push('    modes: {');
      
      // Ring mode config from layouts
      const ringLayout = entry.layouts?.find(l => l.type === 'ring');
      if (ringLayout && ringLayout.colors && ringLayout.colors.length > 0) {
        lines.push('      ring: {');
        lines.push('        colors: [');
        for (let k = 0; k < ringLayout.colors.length; k++) {
          const color = ringLayout.colors[k];
          const isLastColor = k === ringLayout.colors.length - 1;
          lines.push(`          '${color}'${isLastColor ? '' : ','}`);
        }
        lines.push('        ],');
        lines.push('      },');
      }
      
      // Cutout mode config
      if (entry.cutoutMode) {
        lines.push('      cutout: {');
        lines.push(`        offsetEnabled: ${entry.cutoutMode.offsetEnabled},`);
        lines.push(`        defaultOffset: ${entry.cutoutMode.defaultOffset},`);
        lines.push('      },');
      }
      
      lines.push('    },');
    }
    
    lines.push(`  }${isLast ? '' : ','}`);
  }

  lines.push('];');
  lines.push('');

  return lines.join('\n');
}
