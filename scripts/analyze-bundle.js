#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 *
 * Phase 2, Week 4, Day 5
 * Analyzes Next.js build output for bundle size optimization opportunities
 */

const fs = require('fs');
const path = require('path');

// ================================================================
// CONFIGURATION
// ================================================================

const BUILD_DIR = path.join(process.cwd(), '.next');
const THRESHOLDS = {
  totalSize: 500 * 1024, // 500KB total JS
  chunkSize: 100 * 1024, // 100KB per chunk
  firstLoad: 150 * 1024, // 150KB first load JS
};

// ================================================================
// HELPERS
// ================================================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getColor(size, threshold) {
  if (size > threshold * 1.5) return '\x1b[31m'; // Red
  if (size > threshold) return '\x1b[33m'; // Yellow
  return '\x1b[32m'; // Green
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// ================================================================
// ANALYSIS FUNCTIONS
// ================================================================

function analyzeBuildManifest() {
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('Build manifest not found. Run `npm run build` first.');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function analyzeAppPathsManifest() {
  const manifestPath = path.join(BUILD_DIR, 'app-paths-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function getChunkSizes() {
  const staticDir = path.join(BUILD_DIR, 'static', 'chunks');
  const sizes = {};

  if (!fs.existsSync(staticDir)) {
    return sizes;
  }

  function walkDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, path.join(prefix, file));
      } else if (file.endsWith('.js')) {
        const relativePath = path.join(prefix, file);
        sizes[relativePath] = stat.size;
      }
    }
  }

  walkDir(staticDir);
  return sizes;
}

function identifyLargeModules(chunkSizes) {
  const largeChunks = [];

  for (const [name, size] of Object.entries(chunkSizes)) {
    if (size > THRESHOLDS.chunkSize) {
      largeChunks.push({ name, size });
    }
  }

  return largeChunks.sort((a, b) => b.size - a.size);
}

function analyzeRoutes(manifest) {
  const routes = {};

  for (const [route, chunks] of Object.entries(manifest.pages || {})) {
    const totalSize = chunks.reduce((sum, chunk) => {
      const chunkPath = path.join(BUILD_DIR, 'static', chunk);
      if (fs.existsSync(chunkPath)) {
        return sum + fs.statSync(chunkPath).size;
      }
      return sum;
    }, 0);

    routes[route] = {
      chunks: chunks.length,
      totalSize,
    };
  }

  return routes;
}

function generateRecommendations(chunkSizes, largeChunks) {
  const recommendations = [];

  // Check for large chart libraries
  for (const [name, size] of Object.entries(chunkSizes)) {
    if (name.includes('recharts') && size > 50 * 1024) {
      recommendations.push({
        type: 'warning',
        message: 'Recharts adds significant bundle size. Consider:',
        suggestions: [
          'Use dynamic imports for chart components',
          'Import only specific chart types (LineChart, PieChart)',
          'Consider lighter alternatives like Chart.js or Tremor',
        ],
      });
      break;
    }
  }

  // Check for moment.js
  for (const name of Object.keys(chunkSizes)) {
    if (name.includes('moment')) {
      recommendations.push({
        type: 'error',
        message: 'moment.js detected! This adds ~300KB to your bundle.',
        suggestions: [
          'Replace with date-fns (modular, tree-shakeable)',
          'Replace with dayjs (2KB alternative)',
          'Use native Intl.DateTimeFormat for simple formatting',
        ],
      });
      break;
    }
  }

  // Check for lodash full import
  for (const name of Object.keys(chunkSizes)) {
    if (name.includes('lodash') && !name.includes('lodash-es')) {
      recommendations.push({
        type: 'warning',
        message: 'Full lodash import detected.',
        suggestions: [
          'Import specific functions: import debounce from "lodash/debounce"',
          'Use lodash-es for ES modules (better tree-shaking)',
          'Consider native alternatives for simple utilities',
        ],
      });
      break;
    }
  }

  // Generic recommendations for large chunks
  if (largeChunks.length > 3) {
    recommendations.push({
      type: 'info',
      message: `${largeChunks.length} chunks exceed ${formatBytes(THRESHOLDS.chunkSize)}.`,
      suggestions: [
        'Use next/dynamic for heavy components',
        'Implement route-based code splitting',
        'Lazy load below-the-fold content',
      ],
    });
  }

  return recommendations;
}

// ================================================================
// REPORT GENERATION
// ================================================================

function printReport(manifest, chunkSizes, largeChunks, recommendations) {
  console.log('\n' + BOLD + '📦 Bundle Size Analysis Report' + RESET);
  console.log('━'.repeat(50));

  // Summary
  const totalSize = Object.values(chunkSizes).reduce((a, b) => a + b, 0);
  const avgChunkSize = totalSize / Object.keys(chunkSizes).length;

  console.log('\n' + BOLD + '📊 Summary' + RESET);
  console.log(`   Total JS Size: ${getColor(totalSize, THRESHOLDS.totalSize)}${formatBytes(totalSize)}${RESET}`);
  console.log(`   Total Chunks: ${Object.keys(chunkSizes).length}`);
  console.log(`   Avg Chunk Size: ${formatBytes(avgChunkSize)}`);

  // Large chunks
  if (largeChunks.length > 0) {
    console.log('\n' + BOLD + '⚠️  Large Chunks (>' + formatBytes(THRESHOLDS.chunkSize) + ')' + RESET);
    for (const chunk of largeChunks.slice(0, 10)) {
      const color = getColor(chunk.size, THRESHOLDS.chunkSize);
      console.log(`   ${color}${formatBytes(chunk.size).padStart(10)}${RESET} ${DIM}${chunk.name}${RESET}`);
    }
    if (largeChunks.length > 10) {
      console.log(`   ${DIM}... and ${largeChunks.length - 10} more${RESET}`);
    }
  }

  // Top 10 chunks by size
  const sortedChunks = Object.entries(chunkSizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n' + BOLD + '📈 Top 10 Chunks by Size' + RESET);
  for (const [name, size] of sortedChunks) {
    const percent = ((size / totalSize) * 100).toFixed(1);
    const color = getColor(size, THRESHOLDS.chunkSize);
    console.log(`   ${color}${formatBytes(size).padStart(10)}${RESET} (${percent}%) ${DIM}${name}${RESET}`);
  }

  // Recommendations
  if (recommendations.length > 0) {
    console.log('\n' + BOLD + '💡 Recommendations' + RESET);
    for (const rec of recommendations) {
      const icon = rec.type === 'error' ? '🔴' : rec.type === 'warning' ? '🟡' : '🔵';
      console.log(`\n   ${icon} ${rec.message}`);
      for (const suggestion of rec.suggestions) {
        console.log(`      • ${suggestion}`);
      }
    }
  }

  // Status
  console.log('\n' + '━'.repeat(50));
  if (totalSize <= THRESHOLDS.totalSize && largeChunks.length === 0) {
    console.log('\x1b[32m✓ Bundle size is within acceptable limits\x1b[0m\n');
  } else if (totalSize > THRESHOLDS.totalSize * 1.5) {
    console.log('\x1b[31m✗ Bundle size exceeds recommended limits - optimization needed\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[33m⚠ Bundle size is approaching limits - consider optimization\x1b[0m\n');
  }
}

function generateJsonReport(chunkSizes, largeChunks, recommendations) {
  const totalSize = Object.values(chunkSizes).reduce((a, b) => a + b, 0);

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      chunkCount: Object.keys(chunkSizes).length,
      largeChunkCount: largeChunks.length,
      status: totalSize <= THRESHOLDS.totalSize ? 'pass' : 'warning',
    },
    thresholds: {
      totalSize: THRESHOLDS.totalSize,
      chunkSize: THRESHOLDS.chunkSize,
    },
    largeChunks: largeChunks.map(c => ({
      name: c.name,
      size: c.size,
      sizeFormatted: formatBytes(c.size),
    })),
    recommendations,
    chunks: Object.entries(chunkSizes)
      .map(([name, size]) => ({ name, size, sizeFormatted: formatBytes(size) }))
      .sort((a, b) => b.size - a.size),
  };
}

// ================================================================
// MAIN
// ================================================================

function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const ciMode = args.includes('--ci');

  try {
    const manifest = analyzeBuildManifest();
    const chunkSizes = getChunkSizes();
    const largeChunks = identifyLargeModules(chunkSizes);
    const recommendations = generateRecommendations(chunkSizes, largeChunks);

    if (jsonOutput) {
      const report = generateJsonReport(chunkSizes, largeChunks, recommendations);
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(manifest, chunkSizes, largeChunks, recommendations);
    }

    // In CI mode, fail if bundle is too large
    if (ciMode) {
      const totalSize = Object.values(chunkSizes).reduce((a, b) => a + b, 0);
      if (totalSize > THRESHOLDS.totalSize * 1.5) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

main();
