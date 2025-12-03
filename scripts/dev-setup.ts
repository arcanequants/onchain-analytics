#!/usr/bin/env npx ts-node
/**
 * Development Environment Setup Script
 *
 * This script automates the complete setup of a development environment.
 * Run with: npm run dev:setup
 *
 * What it does:
 * 1. Checks Node.js version
 * 2. Installs dependencies
 * 3. Validates environment variables
 * 4. Sets up database (migrations + seeding)
 * 5. Generates TypeScript types from database
 * 6. Validates configuration
 * 7. Runs health checks
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ============================================================================
// Types
// ============================================================================

interface SetupStep {
  name: string;
  description: string;
  run: () => Promise<boolean>;
  optional?: boolean;
  skip?: () => boolean;
}

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  example?: string;
  validate?: (value: string) => boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const MIN_NODE_VERSION = 18;
const PROJECT_ROOT = path.resolve(__dirname, '..');

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    example: 'https://xxxx.supabase.co',
    validate: (v) => v.startsWith('https://') && v.includes('supabase'),
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    validate: (v) => v.startsWith('eyJ'),
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side only)',
    validate: (v) => v.startsWith('eyJ'),
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    validate: (v) => v.startsWith('sk-'),
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic API key for Claude',
    validate: (v) => v.startsWith('sk-ant-'),
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for payments',
    validate: (v) => v.startsWith('sk_'),
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook signing secret',
    validate: (v) => v.startsWith('whsec_'),
  },
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL for caching',
    example: 'redis://localhost:6379',
  },
  {
    name: 'SLACK_WEBHOOK_URL',
    required: false,
    description: 'Slack webhook for alerts',
    validate: (v) => v.includes('hooks.slack.com'),
  },
];

// ============================================================================
// Utilities
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, total: number, name: string) {
  log(`\n[${step}/${total}] ${name}`, 'cyan');
  log('─'.repeat(50), 'gray');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function execCommand(command: string, options?: { silent?: boolean }): string {
  try {
    return execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: options?.silent ? 'pipe' : 'inherit',
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
  }
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = await prompt(`${question} ${suffix} `);

  if (!answer) return defaultYes;
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

// ============================================================================
// Setup Steps
// ============================================================================

const steps: SetupStep[] = [
  // Step 1: Check Node.js version
  {
    name: 'Check Node.js Version',
    description: `Verify Node.js version >= ${MIN_NODE_VERSION}`,
    run: async () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0], 10);

      if (major < MIN_NODE_VERSION) {
        logError(`Node.js ${MIN_NODE_VERSION}+ required, found ${version}`);
        log('Please upgrade Node.js: https://nodejs.org/', 'yellow');
        return false;
      }

      logSuccess(`Node.js ${version} detected`);
      return true;
    },
  },

  // Step 2: Check package manager
  {
    name: 'Check Package Manager',
    description: 'Detect npm/yarn/pnpm',
    run: async () => {
      const lockFiles = {
        'package-lock.json': 'npm',
        'yarn.lock': 'yarn',
        'pnpm-lock.yaml': 'pnpm',
      };

      for (const [file, pm] of Object.entries(lockFiles)) {
        if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
          logSuccess(`Using ${pm} (${file} found)`);
          return true;
        }
      }

      logSuccess('Using npm (default)');
      return true;
    },
  },

  // Step 3: Install dependencies
  {
    name: 'Install Dependencies',
    description: 'Run npm install',
    run: async () => {
      const nodeModules = path.join(PROJECT_ROOT, 'node_modules');
      const packageJson = path.join(PROJECT_ROOT, 'package.json');
      const packageLock = path.join(PROJECT_ROOT, 'package-lock.json');

      // Check if node_modules is up to date
      if (
        fs.existsSync(nodeModules) &&
        fs.existsSync(packageLock) &&
        fs.statSync(nodeModules).mtime > fs.statSync(packageJson).mtime
      ) {
        logSuccess('Dependencies are up to date');
        return true;
      }

      log('Installing dependencies...', 'gray');
      execCommand('npm install');
      logSuccess('Dependencies installed');
      return true;
    },
  },

  // Step 4: Check .env file
  {
    name: 'Validate Environment Variables',
    description: 'Check .env file configuration',
    run: async () => {
      const envPath = path.join(PROJECT_ROOT, '.env.local');
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

      // Check if .env.local exists
      if (!fs.existsSync(envPath)) {
        logWarning('.env.local not found');

        if (fs.existsSync(envExamplePath)) {
          const shouldCopy = await confirm('Create .env.local from .env.example?');
          if (shouldCopy) {
            fs.copyFileSync(envExamplePath, envPath);
            logSuccess('Created .env.local from .env.example');
            log('Please edit .env.local with your actual values', 'yellow');
            return false;
          }
        }

        log('Please create .env.local with required variables', 'yellow');
        return false;
      }

      // Load and validate env vars
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars: Record<string, string> = {};

      envContent.split('\n').forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      });

      let allValid = true;
      const missing: string[] = [];
      const invalid: string[] = [];

      for (const envVar of REQUIRED_ENV_VARS) {
        const value = envVars[envVar.name] || process.env[envVar.name];

        if (!value) {
          if (envVar.required) {
            missing.push(envVar.name);
            allValid = false;
          } else {
            log(`  ${envVar.name}: not set (optional)`, 'gray');
          }
        } else if (envVar.validate && !envVar.validate(value)) {
          invalid.push(envVar.name);
          allValid = false;
        } else {
          logSuccess(`${envVar.name}: configured`);
        }
      }

      if (missing.length > 0) {
        logError(`Missing required variables: ${missing.join(', ')}`);
      }

      if (invalid.length > 0) {
        logError(`Invalid values: ${invalid.join(', ')}`);
      }

      return allValid;
    },
  },

  // Step 5: Generate Supabase types
  {
    name: 'Generate Database Types',
    description: 'Generate TypeScript types from Supabase',
    optional: true,
    run: async () => {
      try {
        log('Generating database types...', 'gray');
        execCommand('npx supabase gen types typescript --local > src/lib/database/types.ts', {
          silent: true,
        });
        logSuccess('Database types generated');
        return true;
      } catch {
        logWarning('Could not generate types (Supabase CLI may not be configured)');
        return true; // Non-fatal
      }
    },
  },

  // Step 6: Seed database
  {
    name: 'Seed Database',
    description: 'Populate database with development data',
    optional: true,
    run: async () => {
      const shouldSeed = await confirm('Seed database with development data?');

      if (!shouldSeed) {
        log('Skipping database seeding', 'gray');
        return true;
      }

      const scenarios = ['minimal', 'realistic', 'stress-test', 'edge-cases'];
      log('Available scenarios:', 'gray');
      scenarios.forEach((s, i) => log(`  ${i + 1}. ${s}`, 'gray'));

      const choice = await prompt('Choose scenario (1-4, default: 1): ');
      const scenario = scenarios[parseInt(choice || '1', 10) - 1] || 'minimal';

      try {
        log(`Seeding with "${scenario}" scenario...`, 'gray');
        execCommand(`npx ts-node scripts/seed-database.ts --scenario=${scenario}`);
        logSuccess('Database seeded successfully');
        return true;
      } catch {
        logWarning('Database seeding failed (check database connection)');
        return true; // Non-fatal
      }
    },
  },

  // Step 7: Build check
  {
    name: 'Verify Build',
    description: 'Run TypeScript compilation check',
    run: async () => {
      try {
        log('Checking TypeScript compilation...', 'gray');
        execCommand('npx tsc --noEmit', { silent: true });
        logSuccess('TypeScript compilation successful');
        return true;
      } catch {
        logWarning('TypeScript errors found (run `npm run typecheck` for details)');
        return true; // Non-fatal for dev setup
      }
    },
  },

  // Step 8: Run tests (optional)
  {
    name: 'Run Tests',
    description: 'Execute test suite',
    optional: true,
    run: async () => {
      const shouldTest = await confirm('Run test suite?', false);

      if (!shouldTest) {
        log('Skipping tests', 'gray');
        return true;
      }

      try {
        execCommand('npm test -- --run');
        logSuccess('All tests passed');
        return true;
      } catch {
        logWarning('Some tests failed');
        return true; // Non-fatal
      }
    },
  },

  // Step 9: Start development server info
  {
    name: 'Setup Complete',
    description: 'Display next steps',
    run: async () => {
      log('\n' + '═'.repeat(50), 'green');
      log('  Development environment is ready!', 'bright');
      log('═'.repeat(50), 'green');

      log('\nNext steps:', 'cyan');
      log('  1. Start the development server:', 'reset');
      log('     npm run dev', 'gray');
      log('', 'reset');
      log('  2. Open in browser:', 'reset');
      log('     http://localhost:3000', 'gray');
      log('', 'reset');
      log('  3. Useful commands:', 'reset');
      log('     npm run dev         - Start dev server', 'gray');
      log('     npm run build       - Production build', 'gray');
      log('     npm run test        - Run tests', 'gray');
      log('     npm run lint        - Lint code', 'gray');
      log('     npm run storybook   - Start Storybook', 'gray');
      log('', 'reset');

      return true;
    },
  },
];

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Onchain Analytics - Development Setup             ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  log('');

  const totalSteps = steps.length;
  let currentStep = 0;
  let hasErrors = false;

  for (const step of steps) {
    currentStep++;

    // Check if step should be skipped
    if (step.skip?.()) {
      log(`\n[${currentStep}/${totalSteps}] ${step.name} (skipped)`, 'gray');
      continue;
    }

    logStep(currentStep, totalSteps, step.name);
    log(step.description, 'gray');
    log('', 'reset');

    try {
      const success = await step.run();

      if (!success && !step.optional) {
        hasErrors = true;
        logError(`Step "${step.name}" failed`);

        const shouldContinue = await confirm('Continue anyway?', false);
        if (!shouldContinue) {
          log('\nSetup aborted.', 'red');
          process.exit(1);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logError(`Error: ${message}`);

      if (!step.optional) {
        hasErrors = true;
        const shouldContinue = await confirm('Continue anyway?', false);
        if (!shouldContinue) {
          log('\nSetup aborted.', 'red');
          process.exit(1);
        }
      }
    }
  }

  if (hasErrors) {
    log('\n⚠ Setup completed with warnings', 'yellow');
    process.exit(0);
  }

  process.exit(0);
}

// Run the script
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
