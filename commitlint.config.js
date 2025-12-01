/**
 * Commitlint Configuration
 *
 * Enforces Conventional Commits specification
 * https://www.conventionalcommits.org/
 *
 * Phase 3, Week 10 - DevSecOps
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only
        'style', // Formatting, missing semicolons, etc.
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Performance improvement
        'test', // Adding or updating tests
        'build', // Build system or external dependencies
        'ci', // CI configuration files and scripts
        'chore', // Other changes that don't modify src or test files
        'revert', // Reverts a previous commit
        'security', // Security improvements
        'wip', // Work in progress (for local commits only)
      ],
    ],

    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],

    // Type cannot be empty
    'type-empty': [2, 'never'],

    // Subject (description) cannot be empty
    'subject-empty': [2, 'never'],

    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],

    // Subject case: sentence-case is recommended but not enforced
    'subject-case': [0],

    // Header (type + scope + subject) max length
    'header-max-length': [2, 'always', 100],

    // Body line max length
    'body-max-line-length': [2, 'always', 200],

    // Footer line max length
    'footer-max-line-length': [2, 'always', 200],

    // Scope case: lower-case
    'scope-case': [2, 'always', 'lower-case'],

    // Scope is optional but if present, must be valid
    'scope-enum': [
      1, // Warning only
      'always',
      [
        // Core modules
        'api',
        'auth',
        'db',
        'ui',
        'ai',
        'nlp',

        // Infrastructure
        'ci',
        'deploy',
        'docker',
        'k8s',

        // Features
        'analysis',
        'score',
        'recommendations',
        'billing',
        'dashboard',

        // Quality
        'test',
        'e2e',
        'security',
        'performance',

        // Documentation
        'docs',
        'readme',

        // Config
        'config',
        'env',
        'deps',

        // Components
        'components',
        'hooks',
        'utils',
        'types',

        // Pages
        'pages',
        'routes',

        // Other
        'misc',
        'release',
      ],
    ],
  },

  // Prompt settings (for interactive commit)
  prompt: {
    questions: {
      type: {
        description: "Select the type of change you're committing",
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description:
              'Changes that do not affect the meaning of the code (white-space, formatting, etc)',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description:
              'Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description: 'Changes to our CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑',
          },
          security: {
            description: 'Security improvements',
            title: 'Security',
            emoji: '🔒',
          },
        },
      },
      scope: {
        description:
          'What is the scope of this change (e.g. api, ui, auth)',
      },
      subject: {
        description: 'Write a short, imperative description of the change',
      },
      body: {
        description: 'Provide a longer description of the change (optional)',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description:
          'A BREAKING CHANGE commit requires a body. Please describe the breaking change',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description:
          'If issues are closed, the commit requires a body. Please describe the issues',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123")',
      },
    },
  },
};
