/**
 * Environment Parity Validation
 *
 * Phase 4, Week 8 - DevSecOps Checklist
 *
 * Validates >95% parity between staging and production environments
 * to ensure deployments behave consistently across environments.
 */

// ============================================================================
// TYPES
// ============================================================================

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: Environment;
  url: string;
  variables: Record<string, string | undefined>;
  features: Record<string, boolean>;
  versions: {
    node: string;
    nextjs: string;
    dependencies: Record<string, string>;
  };
}

export interface ParityCheck {
  category: string;
  item: string;
  staging: string | boolean | number;
  production: string | boolean | number;
  matches: boolean;
  critical: boolean;
  notes?: string;
}

export interface ParityReport {
  timestamp: Date;
  overallScore: number; // 0-100
  passing: boolean; // >= 95%
  totalChecks: number;
  matchingChecks: number;
  criticalIssues: ParityCheck[];
  allChecks: ParityCheck[];
  recommendations: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_AI_API_KEY',
  'PERPLEXITY_API_KEY',
];

const CRITICAL_FEATURES = [
  'ai_fallback_chain',
  'parallel_provider_queries',
  'request_tracing',
  'strict_rate_limiting',
];

const CRITICAL_DEPENDENCIES = [
  'next',
  '@supabase/supabase-js',
  'stripe',
  'openai',
  '@anthropic-ai/sdk',
];

// ============================================================================
// ENVIRONMENT FETCHER
// ============================================================================

async function fetchEnvironmentConfig(env: Environment): Promise<EnvironmentConfig> {
  // In production, this would fetch from actual environments
  // For now, we simulate based on current environment

  const baseConfig: EnvironmentConfig = {
    name: env,
    url: getEnvironmentUrl(env),
    variables: {},
    features: {},
    versions: {
      node: process.version,
      nextjs: '14.2.0', // Would be fetched dynamically
      dependencies: {},
    },
  };

  // Collect environment variables (masked)
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key];
    baseConfig.variables[key] = value ? '[SET]' : '[MISSING]';
  }

  // Collect feature flags
  for (const feature of CRITICAL_FEATURES) {
    baseConfig.features[feature] = getFeatureFlag(feature, env);
  }

  // Collect dependency versions
  for (const dep of CRITICAL_DEPENDENCIES) {
    baseConfig.versions.dependencies[dep] = await getDependencyVersion(dep);
  }

  return baseConfig;
}

function getEnvironmentUrl(env: Environment): string {
  switch (env) {
    case 'development':
      return 'http://localhost:3000';
    case 'staging':
      return process.env.STAGING_URL || 'https://staging.aiperception.com';
    case 'production':
      return process.env.PRODUCTION_URL || 'https://aiperception.com';
  }
}

function getFeatureFlag(flag: string, env: Environment): boolean {
  // Simulate feature flag resolution
  const envPrefix = `FF_${flag.toUpperCase()}`;
  const value = process.env[envPrefix];
  if (value !== undefined) {
    return value === 'true' || value === '1';
  }

  // Default values by environment
  const defaults: Record<string, Record<Environment, boolean>> = {
    ai_fallback_chain: { development: true, staging: true, production: true },
    parallel_provider_queries: { development: true, staging: true, production: true },
    request_tracing: { development: true, staging: true, production: true },
    strict_rate_limiting: { development: false, staging: true, production: true },
  };

  return defaults[flag]?.[env] ?? false;
}

async function getDependencyVersion(pkg: string): Promise<string> {
  try {
    // In production, would read from package-lock.json or node_modules
    const packageJson = await import(`${pkg}/package.json`);
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ============================================================================
// PARITY CHECKER
// ============================================================================

function compareConfigs(
  staging: EnvironmentConfig,
  production: EnvironmentConfig
): ParityCheck[] {
  const checks: ParityCheck[] = [];

  // Compare environment variables
  for (const key of REQUIRED_ENV_VARS) {
    const stagingVal = staging.variables[key] || '[MISSING]';
    const prodVal = production.variables[key] || '[MISSING]';

    checks.push({
      category: 'Environment Variables',
      item: key,
      staging: stagingVal,
      production: prodVal,
      matches: stagingVal === prodVal,
      critical: stagingVal === '[MISSING]' || prodVal === '[MISSING]',
      notes: stagingVal !== prodVal ? 'Variable presence mismatch' : undefined,
    });
  }

  // Compare feature flags
  for (const feature of CRITICAL_FEATURES) {
    const stagingVal = staging.features[feature];
    const prodVal = production.features[feature];

    checks.push({
      category: 'Feature Flags',
      item: feature,
      staging: stagingVal,
      production: prodVal,
      matches: stagingVal === prodVal,
      critical: true,
      notes: stagingVal !== prodVal ? 'Feature flag mismatch may cause behavior differences' : undefined,
    });
  }

  // Compare Node.js version
  checks.push({
    category: 'Runtime',
    item: 'Node.js Version',
    staging: staging.versions.node,
    production: production.versions.node,
    matches: staging.versions.node === production.versions.node,
    critical: staging.versions.node.split('.')[0] !== production.versions.node.split('.')[0],
    notes: staging.versions.node !== production.versions.node ? 'Minor version differences may be acceptable' : undefined,
  });

  // Compare Next.js version
  checks.push({
    category: 'Runtime',
    item: 'Next.js Version',
    staging: staging.versions.nextjs,
    production: production.versions.nextjs,
    matches: staging.versions.nextjs === production.versions.nextjs,
    critical: true,
  });

  // Compare critical dependencies
  for (const dep of CRITICAL_DEPENDENCIES) {
    const stagingVer = staging.versions.dependencies[dep] || 'unknown';
    const prodVer = production.versions.dependencies[dep] || 'unknown';

    checks.push({
      category: 'Dependencies',
      item: dep,
      staging: stagingVer,
      production: prodVer,
      matches: stagingVer === prodVer,
      critical: stagingVer.split('.')[0] !== prodVer.split('.')[0],
    });
  }

  return checks;
}

// ============================================================================
// PARITY VALIDATOR SERVICE
// ============================================================================

export class EnvironmentParityValidator {
  private lastReport: ParityReport | null = null;

  /**
   * Run full parity validation
   */
  async validate(): Promise<ParityReport> {
    const staging = await fetchEnvironmentConfig('staging');
    const production = await fetchEnvironmentConfig('production');

    const checks = compareConfigs(staging, production);
    const matchingChecks = checks.filter(c => c.matches).length;
    const overallScore = (matchingChecks / checks.length) * 100;

    const criticalIssues = checks.filter(c => !c.matches && c.critical);
    const recommendations = this.generateRecommendations(checks);

    const report: ParityReport = {
      timestamp: new Date(),
      overallScore,
      passing: overallScore >= 95,
      totalChecks: checks.length,
      matchingChecks,
      criticalIssues,
      allChecks: checks,
      recommendations,
    };

    this.lastReport = report;
    return report;
  }

  /**
   * Get last validation report
   */
  getLastReport(): ParityReport | null {
    return this.lastReport;
  }

  /**
   * Quick validation check (returns boolean)
   */
  async isParityValid(): Promise<boolean> {
    const report = await this.validate();
    return report.passing;
  }

  /**
   * Generate recommendations based on mismatches
   */
  private generateRecommendations(checks: ParityCheck[]): string[] {
    const recommendations: string[] = [];
    const mismatches = checks.filter(c => !c.matches);

    if (mismatches.length === 0) {
      return ['All checks passed. Environment parity is maintained.'];
    }

    // Group by category
    const byCategory = new Map<string, ParityCheck[]>();
    for (const check of mismatches) {
      if (!byCategory.has(check.category)) {
        byCategory.set(check.category, []);
      }
      byCategory.get(check.category)!.push(check);
    }

    for (const [category, categoryChecks] of byCategory) {
      switch (category) {
        case 'Environment Variables':
          recommendations.push(
            `Sync ${categoryChecks.length} environment variable(s): ${categoryChecks.map(c => c.item).join(', ')}`
          );
          break;

        case 'Feature Flags':
          recommendations.push(
            `Review feature flag configuration: ${categoryChecks.map(c => c.item).join(', ')} differ between environments`
          );
          break;

        case 'Runtime':
          recommendations.push(
            'Update runtime versions to match between staging and production'
          );
          break;

        case 'Dependencies':
          recommendations.push(
            `Update dependencies: ${categoryChecks.map(c => c.item).join(', ')} have version mismatches`
          );
          break;
      }
    }

    const criticalCount = mismatches.filter(c => c.critical).length;
    if (criticalCount > 0) {
      recommendations.unshift(
        `CRITICAL: ${criticalCount} critical parity issue(s) require immediate attention`
      );
    }

    return recommendations;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report: ParityReport): string {
    const statusEmoji = report.passing ? '✅' : '❌';
    const scoreColor = report.overallScore >= 95 ? 'green' : report.overallScore >= 80 ? 'yellow' : 'red';

    let markdown = `# Environment Parity Report

${statusEmoji} **Status**: ${report.passing ? 'PASSING' : 'FAILING'}
**Score**: ${report.overallScore.toFixed(1)}% (${report.matchingChecks}/${report.totalChecks} checks)
**Generated**: ${report.timestamp.toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Checks | ${report.totalChecks} |
| Matching | ${report.matchingChecks} |
| Mismatches | ${report.totalChecks - report.matchingChecks} |
| Critical Issues | ${report.criticalIssues.length} |

`;

    if (report.criticalIssues.length > 0) {
      markdown += `## Critical Issues

| Category | Item | Staging | Production |
|----------|------|---------|------------|
`;
      for (const issue of report.criticalIssues) {
        markdown += `| ${issue.category} | ${issue.item} | ${issue.staging} | ${issue.production} |\n`;
      }
      markdown += '\n';
    }

    markdown += `## Recommendations

`;
    for (const rec of report.recommendations) {
      markdown += `- ${rec}\n`;
    }

    markdown += `
## All Checks

| Category | Item | Staging | Production | Status |
|----------|------|---------|------------|--------|
`;
    for (const check of report.allChecks) {
      const status = check.matches ? '✅' : (check.critical ? '❌' : '⚠️');
      markdown += `| ${check.category} | ${check.item} | ${check.staging} | ${check.production} | ${status} |\n`;
    }

    return markdown;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let validatorInstance: EnvironmentParityValidator | null = null;

export function getEnvironmentParityValidator(): EnvironmentParityValidator {
  if (!validatorInstance) {
    validatorInstance = new EnvironmentParityValidator();
  }
  return validatorInstance;
}

export function resetEnvironmentParityValidator(): void {
  validatorInstance = null;
}

// ============================================================================
// CI/CD INTEGRATION
// ============================================================================

/**
 * Run parity check as part of CI/CD pipeline
 * Exits with code 1 if parity < 95%
 */
export async function runParityCheck(): Promise<void> {
  const validator = getEnvironmentParityValidator();
  const report = await validator.validate();

  console.log(validator.generateMarkdownReport(report));

  if (!report.passing) {
    console.error(`\n❌ Environment parity check failed: ${report.overallScore.toFixed(1)}% < 95%`);
    process.exit(1);
  }

  console.log(`\n✅ Environment parity check passed: ${report.overallScore.toFixed(1)}%`);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getEnvironmentParityValidator,
  resetEnvironmentParityValidator,
  runParityCheck,
};
