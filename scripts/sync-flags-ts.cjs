#!/usr/bin/env node
/**
 * Syncs src/flags/flags.ts from public/flags/flags.json
 * 
 * This script reads the generated flags.json manifest and updates flags.ts
 * to match, ensuring the TypeScript source reflects the actual flag assets.
 * 
 * Usage: node scripts/sync-flags-ts.cjs [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public', 'flags', 'flags.json');
const flagsTsPath = path.join(repoRoot, 'src', 'flags', 'flags.ts');

// Read flags.json
if (!fs.existsSync(manifestPath)) {
  console.error('Error: flags.json not found at', manifestPath);
  console.error('Run fetch-and-extract.cjs first to generate flag assets.');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  console.error('Error reading flags.json:', e.message);
  process.exit(1);
}

if (!Array.isArray(manifest) || manifest.length === 0) {
  console.error('Error: flags.json is empty or invalid');
  process.exit(1);
}

console.log(`Found ${manifest.length} flags in flags.json`);

// Map manifest IDs to shorter, semantic IDs for flags.ts
// This allows more human-friendly IDs in the TypeScript source
const ID_MAPPINGS = {
  'transgender-pride': 'trans-pride',
  'gay-pride': 'pride',
  'the-sahrawi-arab-democratic-republic': 'ws',
  'kokbayraq': 'uyghur',
  'north-korea': 'nk',
  'ukraine': 'ua',
  'eritrea': 'er',
  'iran': 'ir',
  'palestine': 'ps',
};

// Determine category based on the type field from manifest
function getCategory(type) {
  const typeToCategory = {
    'Authoritarian State': 'national',
    'Nation': 'national',
    'Occupied / Disputed Territory': 'marginalized',
    'Stateless People': 'marginalized',
    'Marginalised Group': 'marginalized',
    'Indigenous Peoples': 'marginalized',
  };
  return typeToCategory[type] || 'marginalized';
}

// Convert manifest entry to TypeScript flag object
function manifestToTsEntry(entry) {
  const id = ID_MAPPINGS[entry.id] || entry.id;
  const category = getCategory(entry.type);
  
  // Build the stripes array from layouts[0].colors if available
  let stripes = null;
  if (entry.layouts && entry.layouts[0] && entry.layouts[0].colors) {
    const colors = entry.layouts[0].colors.filter(c => c && c !== 'none');
    stripes = colors.map(color => ({
      color: color.toUpperCase(),
      weight: 1,
      label: getColorLabel(color),
    }));
  }

  const obj = {
    id,
    displayName: entry.displayName,
    png_full: entry.png_full,
    png_preview: entry.png_preview,
  };

  // Add svgFilename if present
  if (entry.svgFilename) {
    obj.svgFilename = entry.svgFilename;
  }

  obj.category = category;
  obj.sources = { referenceUrl: entry.link || 'https://en.wikipedia.org' };
  obj.status = 'active';

  // Add pattern with stripes if we have color data
  if (stripes && stripes.length > 0) {
    obj.pattern = {
      type: 'stripes',
      orientation: 'horizontal',
      stripes,
    };
  }

  obj.recommended = { borderStyle: 'ring-stripes', defaultThicknessPct: 12 };

  return obj;
}

// Simple color name guesser
function getColorLabel(hex) {
  if (!hex || hex === 'none') return '';
  const h = hex.toLowerCase();
  
  // Simple color detection based on hex values
  const colorMap = {
    '#ffffff': 'white',
    '#000000': 'black',
    '#ff': 'red',
    '#00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#00ffff': 'cyan',
    '#ffa500': 'orange',
    '#800080': 'purple',
    '#ffc0cb': 'pink',
    '#a52a2a': 'brown',
    '#808080': 'gray',
    '#ffd700': 'gold',
  };

  // Check exact matches first
  if (colorMap[h]) return colorMap[h];

  // Parse RGB components for basic color detection
  const r = parseInt(h.slice(1, 3), 16) || 0;
  const g = parseInt(h.slice(3, 5), 16) || 0;
  const b = parseInt(h.slice(5, 7), 16) || 0;

  // Grayscale detection
  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
    if (r > 200) return 'white';
    if (r < 50) return 'black';
    return 'gray';
  }

  // Dominant color detection
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff < 30) return 'gray';

  if (r === max && g > 100 && b < 100) return 'orange';
  if (r === max && g > 150) return 'yellow';
  if (r === max) return 'red';
  if (g === max && b > 100) return 'cyan';
  if (g === max) return 'green';
  if (b === max && r > 100) return 'purple';
  if (b === max) return 'blue';

  return 'color';
}

// Generate TypeScript source code
function generateTypeScriptSource(entries) {
  const lines = [
    "import { FlagSpec } from './schema';",
    '',
    'export const flags: FlagSpec[] = [',
  ];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;

    lines.push('  {');
    lines.push(`    id: '${entry.id}',`);
    lines.push(`    displayName: '${entry.displayName.replace(/'/g, "\\'")}',`);
    lines.push(`    png_full: '${entry.png_full}',`);
    lines.push(`    png_preview: '${entry.png_preview}',`);
    
    if (entry.svgFilename) {
      lines.push(`    svgFilename: '${entry.svgFilename}',`);
    }
    
    lines.push(`    category: '${entry.category}',`);
    lines.push(`    sources: { referenceUrl: '${entry.sources.referenceUrl}' },`);
    lines.push(`    status: '${entry.status}',`);
    
    if (entry.pattern) {
      lines.push('    pattern: {');
      lines.push(`      type: '${entry.pattern.type}',`);
      lines.push(`      orientation: '${entry.pattern.orientation}',`);
      lines.push('      stripes: [');
      
      for (let j = 0; j < entry.pattern.stripes.length; j++) {
        const stripe = entry.pattern.stripes[j];
        const isLastStripe = j === entry.pattern.stripes.length - 1;
        lines.push(`        { color: '${stripe.color}', weight: ${stripe.weight}, label: '${stripe.label}' }${isLastStripe ? '' : ','}`);
      }
      
      lines.push('      ],');
      lines.push('    },');
    }
    
    lines.push(`    recommended: { borderStyle: '${entry.recommended.borderStyle}', defaultThicknessPct: ${entry.recommended.defaultThicknessPct} },`);
    lines.push(`  }${isLast ? '' : ','}`);
  }

  lines.push('];');
  lines.push(''); // Final newline

  return lines.join('\n');
}

// Convert all manifest entries
const tsEntries = manifest.map(manifestToTsEntry);

// Sort entries to maintain consistent order
// Priority: trans-pride, ua, nk first, then alphabetical by ID
const priorityOrder = ['trans-pride', 'ua', 'nk'];
tsEntries.sort((a, b) => {
  const aIdx = priorityOrder.indexOf(a.id);
  const bIdx = priorityOrder.indexOf(b.id);
  
  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
  if (aIdx !== -1) return -1;
  if (bIdx !== -1) return 1;
  
  return a.id.localeCompare(b.id);
});

// Generate the TypeScript source
const tsSource = generateTypeScriptSource(tsEntries);

if (DRY_RUN) {
  console.log('\n--- DRY RUN: Would write the following to', flagsTsPath, '---\n');
  console.log(tsSource);
  console.log('\n--- End of dry run output ---');
  console.log('\nRun without --dry-run to actually update the file.');
} else {
  // Write to flags.ts
  try {
    fs.writeFileSync(flagsTsPath, tsSource, 'utf8');
    console.log('✅ Successfully updated', flagsTsPath);
    console.log(`   Generated ${tsEntries.length} flag entries`);
  } catch (e) {
    console.error('Error writing flags.ts:', e.message);
    process.exit(1);
  }
}

console.log('\nFlag ID mappings used:');
for (const [manifestId, tsId] of Object.entries(ID_MAPPINGS)) {
  if (manifest.find(e => e.id === manifestId)) {
    console.log(`  ${manifestId} → ${tsId}`);
  }
}
