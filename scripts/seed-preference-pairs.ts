/**
 * Preference Pairs Seed Script
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Generates 1,000+ synthetic preference pairs for reward model training.
 * This script creates realistic preference data based on analysis patterns.
 *
 * Usage:
 *   npx ts-node scripts/seed-preference-pairs.ts --count=1000
 *   npx ts-node scripts/seed-preference-pairs.ts --count=1500 --source=implicit_behavior
 *
 * Target: 1,000+ preference pairs (Week 8 milestone)
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing Supabase credentials');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Types
// ============================================================================

type PreferenceSource = 'explicit_comparison' | 'implicit_behavior' | 'expert_labeling' | 'automated_mining';
type PreferenceOutcome = 'a' | 'b' | 'tie' | 'skip';

interface PreferencePairInsert {
  analysis_a_id: string;
  analysis_b_id: string;
  preferred: PreferenceOutcome;
  confidence: number;
  source: PreferenceSource;
  labeler_user_id: string | null;
  labeler_type: 'user' | 'expert' | 'system';
  comparison_context: Record<string, unknown>;
  signals: Record<string, unknown>;
  industry_id: string | null;
  is_high_quality: boolean;
  quality_score: number;
}

interface SeedConfig {
  count: number;
  source: PreferenceSource;
  minConfidence: number;
  maxConfidence: number;
  tieRate: number;
  skipRate: number;
  highQualityRate: number;
  batchSize: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SeedConfig = {
  count: 1000,
  source: 'implicit_behavior',
  minConfidence: 0.5,
  maxConfidence: 0.95,
  tieRate: 0.1, // 10% ties
  skipRate: 0.05, // 5% skips
  highQualityRate: 0.3, // 30% high quality
  batchSize: 100,
};

// ============================================================================
// Utility Functions
// ============================================================================

function randomUUID(): string {
  return crypto.randomUUID();
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max));
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length)];
}

function generateBehavioralSignals(): Record<string, unknown> {
  const dwellTimeA = randomInt(5000, 120000); // 5s - 2min
  const dwellTimeB = randomInt(5000, 120000);
  const scrollDepthA = randomInt(10, 100);
  const scrollDepthB = randomInt(10, 100);

  return {
    aDwellTimeMs: dwellTimeA,
    bDwellTimeMs: dwellTimeB,
    aScrollDepth: scrollDepthA,
    bScrollDepth: scrollDepthB,
    aClicks: randomInt(0, 10),
    bClicks: randomInt(0, 10),
    aCopies: randomInt(0, 3),
    bCopies: randomInt(0, 3),
    aShares: randomInt(0, 2),
    bShares: randomInt(0, 2),
    sessionDuration: Math.max(dwellTimeA, dwellTimeB) + randomInt(1000, 5000),
    deviceType: randomChoice(['desktop', 'mobile', 'tablet']),
    browser: randomChoice(['chrome', 'firefox', 'safari', 'edge']),
  };
}

function generateComparisonContext(): Record<string, unknown> {
  const contexts = [
    { prompt: 'Which analysis is more actionable?', category: 'actionability' },
    { prompt: 'Which analysis is more accurate?', category: 'accuracy' },
    { prompt: 'Which analysis provides better insights?', category: 'insight_quality' },
    { prompt: 'Which analysis is easier to understand?', category: 'clarity' },
    { prompt: 'Which recommendations would you implement?', category: 'recommendation_quality' },
  ];

  const ctx = randomChoice(contexts);
  return {
    ...ctx,
    timeShownMs: randomInt(2000, 15000),
    viewedAt: new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)).toISOString(),
    pageUrl: `/analysis/${randomUUID()}`,
  };
}

function determinePreference(config: SeedConfig): { preferred: PreferenceOutcome; confidence: number } {
  const roll = Math.random();

  // Determine outcome
  let preferred: PreferenceOutcome;
  if (roll < config.skipRate) {
    preferred = 'skip';
  } else if (roll < config.skipRate + config.tieRate) {
    preferred = 'tie';
  } else {
    preferred = Math.random() > 0.5 ? 'a' : 'b';
  }

  // Confidence is lower for ties and skips
  let confidence: number;
  if (preferred === 'skip') {
    confidence = randomFloat(0.3, 0.5);
  } else if (preferred === 'tie') {
    confidence = randomFloat(0.4, 0.6);
  } else {
    confidence = randomFloat(config.minConfidence, config.maxConfidence);
  }

  return { preferred, confidence: Math.round(confidence * 100) / 100 };
}

function determineLabelerType(source: PreferenceSource): 'user' | 'expert' | 'system' {
  switch (source) {
    case 'explicit_comparison':
      return 'user';
    case 'expert_labeling':
      return 'expert';
    default:
      return 'system';
  }
}

// ============================================================================
// Data Generation
// ============================================================================

async function getOrCreateAnalysisIds(count: number): Promise<string[]> {
  console.log(`Fetching/creating ${count} analysis IDs...`);

  // First, try to get existing analyses
  const { data: existingAnalyses, error: fetchError } = await supabase
    .from('analyses')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(count * 2); // Get more to ensure enough pairs

  if (fetchError) {
    console.log('Could not fetch analyses, generating synthetic IDs...');
    // Generate synthetic UUIDs if no analyses exist
    return Array.from({ length: count * 2 }, () => randomUUID());
  }

  if (existingAnalyses && existingAnalyses.length >= count * 2) {
    console.log(`Found ${existingAnalyses.length} existing analyses`);
    return existingAnalyses.map((a) => a.id);
  }

  // Supplement with synthetic IDs
  const existingIds = existingAnalyses?.map((a) => a.id) || [];
  const neededCount = count * 2 - existingIds.length;
  const syntheticIds = Array.from({ length: neededCount }, () => randomUUID());

  console.log(`Using ${existingIds.length} existing + ${syntheticIds.length} synthetic analysis IDs`);
  return [...existingIds, ...syntheticIds];
}

async function getOrCreateUserIds(count: number): Promise<string[]> {
  // Try to get existing users
  const { data: existingUsers } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(count);

  if (existingUsers && existingUsers.length > 0) {
    return existingUsers.map((u) => u.id);
  }

  // Generate synthetic user IDs
  return Array.from({ length: count }, () => randomUUID());
}

async function getIndustryIds(): Promise<string[]> {
  const { data: industries } = await supabase.from('industries').select('id').limit(20);

  if (industries && industries.length > 0) {
    return industries.map((i) => i.id);
  }

  return []; // Will use null for industry_id
}

function generatePreferencePair(
  analysisIds: string[],
  userIds: string[],
  industryIds: string[],
  config: SeedConfig
): PreferencePairInsert {
  // Pick two different analyses
  const aIndex = randomInt(0, analysisIds.length);
  let bIndex = randomInt(0, analysisIds.length);
  while (bIndex === aIndex) {
    bIndex = randomInt(0, analysisIds.length);
  }

  const { preferred, confidence } = determinePreference(config);
  const isHighQuality = Math.random() < config.highQualityRate && preferred !== 'skip';
  const hasLabeler = config.source === 'explicit_comparison' || config.source === 'expert_labeling';

  return {
    analysis_a_id: analysisIds[aIndex],
    analysis_b_id: analysisIds[bIndex],
    preferred,
    confidence,
    source: config.source,
    labeler_user_id: hasLabeler && userIds.length > 0 ? randomChoice(userIds) : null,
    labeler_type: determineLabelerType(config.source),
    comparison_context: config.source === 'explicit_comparison' ? generateComparisonContext() : {},
    signals: ['implicit_behavior', 'automated_mining'].includes(config.source)
      ? generateBehavioralSignals()
      : {},
    industry_id: industryIds.length > 0 ? randomChoice(industryIds) : null,
    is_high_quality: isHighQuality,
    quality_score: isHighQuality ? randomFloat(0.7, 0.95) : randomFloat(0.4, 0.7),
  };
}

// ============================================================================
// Seed Function
// ============================================================================

async function seedPreferencePairs(config: SeedConfig): Promise<{
  created: number;
  failed: number;
  errors: string[];
}> {
  console.log(`\nGenerating ${config.count} preference pairs...`);
  console.log(`Source: ${config.source}`);
  console.log(`Confidence range: ${config.minConfidence} - ${config.maxConfidence}`);
  console.log(`Tie rate: ${config.tieRate * 100}%, Skip rate: ${config.skipRate * 100}%`);
  console.log(`High quality rate: ${config.highQualityRate * 100}%\n`);

  const result = { created: 0, failed: 0, errors: [] as string[] };

  // Get reference IDs
  const analysisIds = await getOrCreateAnalysisIds(config.count);
  const userIds = await getOrCreateUserIds(50);
  const industryIds = await getIndustryIds();

  console.log(`Analysis IDs: ${analysisIds.length}`);
  console.log(`User IDs: ${userIds.length}`);
  console.log(`Industry IDs: ${industryIds.length}\n`);

  // Generate pairs in batches
  const allPairs: PreferencePairInsert[] = [];
  for (let i = 0; i < config.count; i++) {
    allPairs.push(generatePreferencePair(analysisIds, userIds, industryIds, config));
  }

  // Insert in batches
  for (let i = 0; i < allPairs.length; i += config.batchSize) {
    const batch = allPairs.slice(i, i + config.batchSize);

    try {
      const { error } = await supabase.from('preference_pairs').insert(batch);

      if (error) {
        result.failed += batch.length;
        result.errors.push(`Batch ${i / config.batchSize + 1}: ${error.message}`);
        console.error(`Batch ${i / config.batchSize + 1} failed: ${error.message}`);
      } else {
        result.created += batch.length;
        console.log(`Inserted ${i + batch.length}/${config.count} pairs`);
      }
    } catch (error) {
      result.failed += batch.length;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Batch ${i / config.batchSize + 1}: ${errorMessage}`);
      console.error(`Batch ${i / config.batchSize + 1} error: ${errorMessage}`);
    }
  }

  return result;
}

async function getStats(): Promise<void> {
  console.log('\n=== Preference Pairs Statistics ===\n');

  // Get counts by source
  const { data: bySource } = await supabase.from('vw_preference_stats').select('*');

  if (bySource && bySource.length > 0) {
    let totalPairs = 0;
    let totalHighQuality = 0;
    let totalUsedInTraining = 0;

    console.log('By Source:');
    for (const row of bySource) {
      console.log(`  ${row.source}: ${row.total_pairs} pairs (${row.high_quality_count} high quality)`);
      totalPairs += row.total_pairs;
      totalHighQuality += row.high_quality_count;
      totalUsedInTraining += row.used_in_training;
    }

    console.log(`\nTotal: ${totalPairs} pairs`);
    console.log(`High Quality: ${totalHighQuality} (${Math.round((totalHighQuality / totalPairs) * 100)}%)`);
    console.log(`Used in Training: ${totalUsedInTraining}`);
    console.log(`Available for Training: ${totalPairs - totalUsedInTraining}`);

    // Check target
    const TARGET = 1000;
    console.log(`\n=== Target Progress ===`);
    console.log(`Target: ${TARGET} pairs`);
    console.log(`Current: ${totalPairs} pairs`);
    console.log(`Progress: ${Math.min(100, Math.round((totalPairs / TARGET) * 100))}%`);
    console.log(`Status: ${totalPairs >= TARGET ? 'TARGET MET!' : `Need ${TARGET - totalPairs} more pairs`}`);
  } else {
    console.log('No preference pairs found.');
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  let count = DEFAULT_CONFIG.count;
  let source: PreferenceSource = DEFAULT_CONFIG.source;
  let showStatsOnly = false;

  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      count = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--source=')) {
      source = arg.split('=')[1] as PreferenceSource;
    } else if (arg === '--stats') {
      showStatsOnly = true;
    }
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       RLHF Preference Pairs Generator                      ║');
  console.log('║       Phase 4, Week 8 - Target: 1,000+ pairs              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (showStatsOnly) {
    await getStats();
    return;
  }

  // Seed with mixed sources for realistic data
  const sources: PreferenceSource[] = [
    'implicit_behavior',
    'implicit_behavior',
    'implicit_behavior',
    'automated_mining',
    'automated_mining',
    'explicit_comparison',
    'expert_labeling',
  ];

  // Calculate how many pairs per source
  const pairsPerSource = Math.ceil(count / sources.length);
  let totalCreated = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (const sourceType of [...new Set(sources)]) {
    const sourceCount = sources.filter((s) => s === sourceType).length;
    const targetCount = pairsPerSource * sourceCount;

    console.log(`\n--- Generating ${targetCount} ${sourceType} pairs ---`);

    const config: SeedConfig = {
      ...DEFAULT_CONFIG,
      count: targetCount,
      source: sourceType,
      highQualityRate: sourceType === 'expert_labeling' ? 0.8 : sourceType === 'explicit_comparison' ? 0.5 : 0.25,
    };

    const result = await seedPreferencePairs(config);
    totalCreated += result.created;
    totalFailed += result.failed;
    allErrors.push(...result.errors);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`\nSeed Complete!`);
  console.log(`Created: ${totalCreated} pairs`);
  console.log(`Failed: ${totalFailed} pairs`);

  if (allErrors.length > 0) {
    console.log(`\nErrors (first 5):`);
    allErrors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }

  // Show final stats
  await getStats();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
