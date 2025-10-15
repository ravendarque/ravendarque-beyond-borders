/**
 * Optimize flag PNG images for 1024x1024px output
 * Resizes images to optimal dimensions while preserving aspect ratio
 * Target: Max width 1536px (1.5x the output size for quality)
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const FLAGS_DIR = 'public/flags';
const TARGET_HEIGHT = 1024; // Target height for 1024x1024 output (width will vary by aspect ratio)
const DRY_RUN = process.argv.includes('--dry-run');

async function getImageDimensions(buffer) {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function optimizeFlag(filename) {
  const inputPath = join(FLAGS_DIR, filename);
  const outputPath = inputPath; // Overwrite original
  
  try {
    const buffer = await readFile(inputPath);
    const { width, height } = await getImageDimensions(buffer);
    const fileStat = await stat(inputPath);
    const originalSizeKB = (fileStat.size / 1024).toFixed(2);
    
    console.log(`\n📄 ${filename}`);
    console.log(`   Original: ${width}x${height} (${originalSizeKB} KB)`);
    
    // Check if resize is needed (height must be TARGET_HEIGHT)
    if (height === TARGET_HEIGHT) {
      console.log(`   ✓ Already optimal (height = ${TARGET_HEIGHT}px)`);
      return { filename, skipped: true, originalSizeKB };
    }
    
    // Calculate new dimensions preserving aspect ratio
    // Set height to TARGET_HEIGHT, calculate width proportionally
    const aspectRatio = width / height;
    const newHeight = TARGET_HEIGHT;
    const newWidth = Math.round(TARGET_HEIGHT * aspectRatio);
    
    console.log(`   → Resizing to: ${newWidth}x${newHeight}`);
    
    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would resize and optimize`);
      return { filename, skipped: true, originalSizeKB, dryRun: true };
    }
    
    // Resize and optimize with sharp
    const optimized = await sharp(buffer)
      .resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3, // High-quality resampling
        fit: 'fill'
      })
      .png({
        compressionLevel: 9, // Maximum compression
        adaptiveFiltering: true,
        palette: false // Keep as RGB for quality
      })
      .toBuffer();
    
    // Write optimized image
    await writeFile(outputPath, optimized);
    
    const newSizeKB = (optimized.length / 1024).toFixed(2);
    const reduction = ((1 - optimized.length / fileStat.size) * 100).toFixed(1);
    
    console.log(`   ✓ Optimized: ${newSizeKB} KB (${reduction}% reduction)`);
    
    return {
      filename,
      originalWidth: width,
      originalHeight: height,
      newWidth,
      newHeight,
      originalSizeKB: parseFloat(originalSizeKB),
      newSizeKB: parseFloat(newSizeKB),
      reduction: parseFloat(reduction)
    };
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return { filename, error: error.message };
  }
}

async function main() {
  console.log('🖼️  Flag Image Optimization Script');
  console.log(`Target: Height = ${TARGET_HEIGHT}px (width varies by aspect ratio)`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);
  
  // Get all PNG files (exclude previews)
  const files = await readdir(FLAGS_DIR);
  const flagFiles = files.filter(f => 
    f.endsWith('.png') && !f.includes('.preview.')
  );
  
  console.log(`Found ${flagFiles.length} flag images\n`);
  console.log('='.repeat(60));
  
  const results = [];
  for (const file of flagFiles) {
    const result = await optimizeFlag(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  
  const optimized = results.filter(r => r.newSizeKB);
  const skipped = results.filter(r => r.skipped && !r.dryRun);
  const errors = results.filter(r => r.error);
  
  if (optimized.length > 0) {
    const totalOriginal = optimized.reduce((sum, r) => sum + r.originalSizeKB, 0);
    const totalNew = optimized.reduce((sum, r) => sum + r.newSizeKB, 0);
    const totalReduction = ((1 - totalNew / totalOriginal) * 100).toFixed(1);
    
    console.log(`✓ Optimized: ${optimized.length} files`);
    console.log(`  Total size: ${totalOriginal.toFixed(2)} KB → ${totalNew.toFixed(2)} KB`);
    console.log(`  Reduction: ${totalReduction}%`);
  }
  
  if (skipped.length > 0) {
    console.log(`\n✓ Already optimal: ${skipped.length} files`);
  }
  
  if (errors.length > 0) {
    console.log(`\n✗ Errors: ${errors.length} files`);
    errors.forEach(r => console.log(`  - ${r.filename}: ${r.error}`));
  }
  
  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Optimization complete!');
  }
}

main().catch(console.error);
