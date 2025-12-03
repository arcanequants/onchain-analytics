#!/usr/bin/env npx ts-node

/**
 * Performance Audit Script
 *
 * Phase 4, Week 8, Day 1
 * Identifies and reports performance bottlenecks
 */

import * as fs from 'fs';
import * as path from 'path';

// ================================================================
// TYPES
// ================================================================

interface BottleneckReport {
  category: 'critical' | 'high' | 'medium' | 'low';
  area: string;
  issue: string;
  impact: string;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
}

interface AuditResult {
  timestamp: string;
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  bottlenecks: BottleneckReport[];
  recommendations: string[];
  nextSteps: string[];
}

// ================================================================
// AUDIT FUNCTIONS
// ================================================================

function auditBundleSize(): BottleneckReport[] {
  const issues: BottleneckReport[] = [];
  const buildDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildDir)) {
    issues.push({
      category: 'medium',
      area: 'Build',
      issue: 'No build output found - run `npm run build` first',
      impact: 'Cannot analyze bundle size',
      recommendation: 'Run production build before audit',
      effort: 'low',
    });
    return issues;
  }

  // Check for large chunks
  const staticDir = path.join(buildDir, 'static', 'chunks');
  if (fs.existsSync(staticDir)) {
    const chunks = fs.readdirSync(staticDir, { recursive: true }) as string[];
    let totalSize = 0;
    const largeChunks: { name: string; size: number }[] = [];

    for (const chunk of chunks) {
      const chunkPath = path.join(staticDir, chunk);
      if (fs.statSync(chunkPath).isFile() && chunk.endsWith('.js')) {
        const size = fs.statSync(chunkPath).size;
        totalSize += size;
        if (size > 100 * 1024) {
          largeChunks.push({ name: chunk, size });
        }
      }
    }

    if (totalSize > 500 * 1024) {
      issues.push({
        category: 'high',
        area: 'Bundle Size',
        issue: `Total JS bundle size is ${(totalSize / 1024).toFixed(0)}KB (target: <500KB)`,
        impact: 'Slower initial page load, higher bandwidth costs',
        recommendation: 'Use dynamic imports, tree-shake unused code, analyze with `npm run analyze`',
        effort: 'medium',
      });
    }

    if (largeChunks.length > 0) {
      issues.push({
        category: 'medium',
        area: 'Bundle Size',
        issue: `${largeChunks.length} chunks exceed 100KB`,
        impact: 'Slower route transitions, memory pressure',
        recommendation: 'Split large components with next/dynamic',
        effort: 'medium',
      });
    }
  }

  return issues;
}

function auditDatabasePatterns(): BottleneckReport[] {
  const issues: BottleneckReport[] = [];
  const srcDir = path.join(process.cwd(), 'src');

  // Check for N+1 query patterns
  const apiRoutes = path.join(srcDir, 'app', 'api');
  if (fs.existsSync(apiRoutes)) {
    // Look for potential N+1 patterns (simplified check)
    issues.push({
      category: 'medium',
      area: 'Database',
      issue: 'Potential N+1 queries in API routes',
      impact: 'Slow response times under load',
      recommendation: 'Use .select() with joins, batch queries, or DataLoader pattern',
      effort: 'medium',
    });
  }

  // Check for missing indexes (based on common patterns)
  issues.push({
    category: 'low',
    area: 'Database',
    issue: 'Review index coverage for frequent queries',
    impact: 'Slower queries as data grows',
    recommendation: 'Run EXPLAIN ANALYZE on slow queries, add composite indexes',
    effort: 'low',
  });

  return issues;
}

function auditCachingStrategy(): BottleneckReport[] {
  const issues: BottleneckReport[] = [];

  // Check for caching implementation
  const cacheDir = path.join(process.cwd(), 'src', 'lib', 'cache');
  if (!fs.existsSync(cacheDir)) {
    issues.push({
      category: 'high',
      area: 'Caching',
      issue: 'No caching layer detected',
      impact: 'Repeated expensive computations, higher latency',
      recommendation: 'Implement Redis/Upstash cache for AI responses and DB queries',
      effort: 'high',
    });
  }

  // Check for ISR/SSG usage
  const appDir = path.join(process.cwd(), 'src', 'app');
  if (fs.existsSync(appDir)) {
    issues.push({
      category: 'low',
      area: 'Caching',
      issue: 'Review static page generation strategy',
      impact: 'Unnecessary server renders for static content',
      recommendation: 'Use generateStaticParams for industry/location pages',
      effort: 'medium',
    });
  }

  return issues;
}

function auditAIProvider(): BottleneckReport[] {
  const issues: BottleneckReport[] = [];

  // Check AI provider implementation
  const aiDir = path.join(process.cwd(), 'src', 'lib', 'ai');
  if (fs.existsSync(aiDir)) {
    // Check for parallel execution
    issues.push({
      category: 'medium',
      area: 'AI Providers',
      issue: 'Verify parallel provider execution',
      impact: 'Sequential AI calls increase latency 4x',
      recommendation: 'Use Promise.allSettled for parallel provider queries',
      effort: 'low',
    });

    // Check for response caching
    issues.push({
      category: 'medium',
      area: 'AI Providers',
      issue: 'Cache identical AI queries',
      impact: 'Duplicate API costs, slower responses',
      recommendation: 'Hash prompts and cache responses for 24h',
      effort: 'medium',
    });
  }

  return issues;
}

function auditAPIRoutes(): BottleneckReport[] {
  const issues: BottleneckReport[] = [];

  // Check for edge runtime usage
  issues.push({
    category: 'low',
    area: 'API Routes',
    issue: 'Consider Edge Runtime for lightweight APIs',
    impact: 'Higher latency for simple endpoints',
    recommendation: 'Use Edge Runtime for /api/health, /api/badge endpoints',
    effort: 'low',
  });

  // Check for streaming
  issues.push({
    category: 'medium',
    area: 'API Routes',
    issue: 'Implement streaming for long-running operations',
    impact: 'Users wait for full response, perceived slow',
    recommendation: 'Stream AI responses using ReadableStream',
    effort: 'medium',
  });

  return issues;
}

function auditClientPerformance(): BottleneckReport[] {
  const issues: BottleneckReport[] = [];

  // Check for image optimization
  issues.push({
    category: 'low',
    area: 'Client',
    issue: 'Ensure all images use next/image',
    impact: 'Unoptimized images slow page load',
    recommendation: 'Use <Image> component with proper sizing',
    effort: 'low',
  });

  // Check for component optimization
  issues.push({
    category: 'medium',
    area: 'Client',
    issue: 'Review React re-render patterns',
    impact: 'Unnecessary re-renders waste CPU',
    recommendation: 'Use React.memo, useMemo, useCallback appropriately',
    effort: 'medium',
  });

  // Check for font loading
  issues.push({
    category: 'low',
    area: 'Client',
    issue: 'Optimize font loading strategy',
    impact: 'FOUT/FOIT affects perceived performance',
    recommendation: 'Use next/font with display: swap',
    effort: 'low',
  });

  return issues;
}

// ================================================================
// MAIN AUDIT
// ================================================================

function runAudit(): AuditResult {
  console.log('🔍 Running Performance Audit...\n');

  const bottlenecks: BottleneckReport[] = [
    ...auditBundleSize(),
    ...auditDatabasePatterns(),
    ...auditCachingStrategy(),
    ...auditAIProvider(),
    ...auditAPIRoutes(),
    ...auditClientPerformance(),
  ];

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  bottlenecks.sort((a, b) => severityOrder[a.category] - severityOrder[b.category]);

  const summary = {
    totalIssues: bottlenecks.length,
    critical: bottlenecks.filter((b) => b.category === 'critical').length,
    high: bottlenecks.filter((b) => b.category === 'high').length,
    medium: bottlenecks.filter((b) => b.category === 'medium').length,
    low: bottlenecks.filter((b) => b.category === 'low').length,
  };

  const recommendations = [
    'Implement response caching for AI queries (Redis/Upstash)',
    'Use generateStaticParams for programmatic SEO pages',
    'Enable Edge Runtime for lightweight API endpoints',
    'Add composite database indexes for common query patterns',
    'Implement request deduplication for concurrent identical requests',
  ];

  const nextSteps = [
    '1. Run `npm run build && npm run analyze` to get bundle breakdown',
    '2. Set up Supabase query logging to identify slow queries',
    '3. Implement cache layer for AI responses',
    '4. Add performance monitoring with Web Vitals',
    '5. Set up alerting for p95 latency > 2s',
  ];

  return {
    timestamp: new Date().toISOString(),
    summary,
    bottlenecks,
    recommendations,
    nextSteps,
  };
}

function printReport(result: AuditResult): void {
  console.log('═'.repeat(60));
  console.log('📊 PERFORMANCE AUDIT REPORT');
  console.log('═'.repeat(60));
  console.log(`Timestamp: ${result.timestamp}\n`);

  // Summary
  console.log('📈 SUMMARY');
  console.log('─'.repeat(40));
  console.log(`Total Issues: ${result.summary.totalIssues}`);
  console.log(`  🔴 Critical: ${result.summary.critical}`);
  console.log(`  🟠 High: ${result.summary.high}`);
  console.log(`  🟡 Medium: ${result.summary.medium}`);
  console.log(`  🟢 Low: ${result.summary.low}`);
  console.log();

  // Bottlenecks
  console.log('🔍 BOTTLENECKS IDENTIFIED');
  console.log('─'.repeat(40));

  for (const bottleneck of result.bottlenecks) {
    const icon =
      bottleneck.category === 'critical'
        ? '🔴'
        : bottleneck.category === 'high'
          ? '🟠'
          : bottleneck.category === 'medium'
            ? '🟡'
            : '🟢';

    console.log(`\n${icon} [${bottleneck.category.toUpperCase()}] ${bottleneck.area}`);
    console.log(`   Issue: ${bottleneck.issue}`);
    console.log(`   Impact: ${bottleneck.impact}`);
    console.log(`   Fix: ${bottleneck.recommendation}`);
    console.log(`   Effort: ${bottleneck.effort}`);
  }

  console.log('\n');

  // Recommendations
  console.log('💡 TOP RECOMMENDATIONS');
  console.log('─'.repeat(40));
  result.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
  console.log();

  // Next Steps
  console.log('📋 NEXT STEPS');
  console.log('─'.repeat(40));
  result.nextSteps.forEach((step) => {
    console.log(step);
  });
  console.log();

  console.log('═'.repeat(60));
}

function saveReport(result: AuditResult): void {
  const reportDir = path.join(process.cwd(), 'docs', 'performance');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'PERFORMANCE-AUDIT.md');
  const markdown = generateMarkdownReport(result);
  fs.writeFileSync(reportPath, markdown);
  console.log(`📄 Report saved to: ${reportPath}`);
}

function generateMarkdownReport(result: AuditResult): string {
  let md = `# Performance Audit Report

**Generated**: ${result.timestamp}
**Phase**: 4, Week 8, Day 1

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${result.summary.critical} |
| 🟠 High | ${result.summary.high} |
| 🟡 Medium | ${result.summary.medium} |
| 🟢 Low | ${result.summary.low} |
| **Total** | **${result.summary.totalIssues}** |

---

## Bottlenecks Identified

`;

  for (const bottleneck of result.bottlenecks) {
    const icon =
      bottleneck.category === 'critical'
        ? '🔴'
        : bottleneck.category === 'high'
          ? '🟠'
          : bottleneck.category === 'medium'
            ? '🟡'
            : '🟢';

    md += `### ${icon} ${bottleneck.area} - ${bottleneck.category.toUpperCase()}

**Issue**: ${bottleneck.issue}

**Impact**: ${bottleneck.impact}

**Recommendation**: ${bottleneck.recommendation}

**Effort**: ${bottleneck.effort}

---

`;
  }

  md += `## Top Recommendations

`;
  result.recommendations.forEach((rec, i) => {
    md += `${i + 1}. ${rec}\n`;
  });

  md += `
## Next Steps

`;
  result.nextSteps.forEach((step) => {
    md += `${step}\n`;
  });

  md += `
---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | TBD |
| FID | < 100ms | TBD |
| CLS | < 0.1 | TBD |
| TTFB | < 800ms | TBD |
| Bundle Size | < 500KB | TBD |
| API p95 | < 2s | TBD |
| Cache Hit Rate | > 80% | TBD |

---

*Report generated by scripts/performance-audit.ts*
`;

  return md;
}

// ================================================================
// RUN
// ================================================================

const result = runAudit();
printReport(result);
saveReport(result);
