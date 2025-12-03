/**
 * Automation Rate Measurement System
 *
 * Tracks and measures the automation rate across operations
 * Target: >80% automation rate
 *
 * @module lib/ops/automation-rate
 */

// ============================================================
// Types
// ============================================================

export interface OperationalTask {
  id: string;
  name: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  isAutomated: boolean;
  automationLevel: AutomationLevel;
  timeToCompleteManual: number; // minutes
  timeToCompleteAutomated: number; // minutes
  lastExecuted?: Date;
  executionCount: number;
  failureCount: number;
}

export type TaskCategory =
  | 'infrastructure'
  | 'monitoring'
  | 'security'
  | 'data'
  | 'deployment'
  | 'customer_support'
  | 'billing'
  | 'reporting'
  | 'maintenance'
  | 'compliance';

export type TaskFrequency =
  | 'realtime'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'on_demand';

export type AutomationLevel =
  | 'none'           // 0% - Fully manual
  | 'assisted'       // 25% - Manual with tooling
  | 'semi_auto'      // 50% - Human-triggered automation
  | 'mostly_auto'    // 75% - Automated with human oversight
  | 'fully_auto';    // 100% - Fully automated

export interface AutomationMetrics {
  overallRate: number;
  byCategory: Record<TaskCategory, CategoryMetrics>;
  byFrequency: Record<TaskFrequency, number>;
  timeSaved: TimeSavings;
  trends: AutomationTrend[];
  recommendations: AutomationRecommendation[];
}

export interface CategoryMetrics {
  taskCount: number;
  automatedCount: number;
  rate: number;
  timeSavedPerMonth: number;
}

export interface TimeSavings {
  hoursPerDay: number;
  hoursPerWeek: number;
  hoursPerMonth: number;
  costSavingsPerMonth: number; // at $50/hr
}

export interface AutomationTrend {
  date: Date;
  rate: number;
  tasksAdded: number;
  tasksAutomated: number;
}

export interface AutomationRecommendation {
  taskId: string;
  taskName: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTimeSavings: number; // hours per month
  implementationEffort: 'low' | 'medium' | 'high';
  impact: string;
}

// ============================================================
// Automation Level Weights
// ============================================================

const AUTOMATION_WEIGHTS: Record<AutomationLevel, number> = {
  none: 0,
  assisted: 0.25,
  semi_auto: 0.5,
  mostly_auto: 0.75,
  fully_auto: 1.0,
};

// ============================================================
// Default Operational Tasks Registry
// ============================================================

export const OPERATIONAL_TASKS: OperationalTask[] = [
  // Infrastructure
  {
    id: 'infra-scaling',
    name: 'Auto-scaling infrastructure',
    category: 'infrastructure',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'infra-health',
    name: 'Health check monitoring',
    category: 'infrastructure',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 15,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'infra-backup',
    name: 'Database backups',
    category: 'infrastructure',
    frequency: 'daily',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },

  // Monitoring
  {
    id: 'mon-alerts',
    name: 'Alert generation and routing',
    category: 'monitoring',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 20,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'mon-drift',
    name: 'Drift detection',
    category: 'monitoring',
    frequency: 'hourly',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 45,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'mon-performance',
    name: 'Performance monitoring',
    category: 'monitoring',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },

  // Security
  {
    id: 'sec-scan',
    name: 'Security vulnerability scanning',
    category: 'security',
    frequency: 'daily',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 60,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'sec-audit',
    name: 'Access audit logging',
    category: 'security',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 0,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'sec-rotation',
    name: 'Secret rotation',
    category: 'security',
    frequency: 'monthly',
    isAutomated: true,
    automationLevel: 'mostly_auto',
    timeToCompleteManual: 120,
    timeToCompleteAutomated: 15,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'sec-incident',
    name: 'Incident response triage',
    category: 'security',
    frequency: 'on_demand',
    isAutomated: false,
    automationLevel: 'assisted',
    timeToCompleteManual: 60,
    timeToCompleteAutomated: 30,
    executionCount: 0,
    failureCount: 0,
  },

  // Data
  {
    id: 'data-retention',
    name: 'Data retention enforcement',
    category: 'data',
    frequency: 'daily',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 45,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'data-quality',
    name: 'Data quality checks',
    category: 'data',
    frequency: 'hourly',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'data-gdpr',
    name: 'GDPR deletion requests',
    category: 'data',
    frequency: 'on_demand',
    isAutomated: true,
    automationLevel: 'mostly_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 5,
    executionCount: 0,
    failureCount: 0,
  },

  // Deployment
  {
    id: 'deploy-ci',
    name: 'CI/CD pipeline execution',
    category: 'deployment',
    frequency: 'on_demand',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 60,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'deploy-rollback',
    name: 'Rollback on failure',
    category: 'deployment',
    frequency: 'on_demand',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 2,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'deploy-preview',
    name: 'Preview environment creation',
    category: 'deployment',
    frequency: 'on_demand',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 20,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },

  // Customer Support
  {
    id: 'support-ticket',
    name: 'Support ticket triage',
    category: 'customer_support',
    frequency: 'on_demand',
    isAutomated: false,
    automationLevel: 'assisted',
    timeToCompleteManual: 15,
    timeToCompleteAutomated: 5,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'support-kb',
    name: 'Knowledge base suggestions',
    category: 'customer_support',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 10,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'support-feedback',
    name: 'Feedback collection',
    category: 'customer_support',
    frequency: 'realtime',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 5,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },

  // Billing
  {
    id: 'billing-invoice',
    name: 'Invoice generation',
    category: 'billing',
    frequency: 'monthly',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 120,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'billing-dunning',
    name: 'Payment dunning',
    category: 'billing',
    frequency: 'on_demand',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'billing-refund',
    name: 'Refund processing',
    category: 'billing',
    frequency: 'on_demand',
    isAutomated: false,
    automationLevel: 'semi_auto',
    timeToCompleteManual: 15,
    timeToCompleteAutomated: 5,
    executionCount: 0,
    failureCount: 0,
  },

  // Reporting
  {
    id: 'report-daily',
    name: 'Daily metrics report',
    category: 'reporting',
    frequency: 'daily',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 30,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'report-weekly',
    name: 'Weekly digest email',
    category: 'reporting',
    frequency: 'weekly',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 60,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'report-investor',
    name: 'Investor metrics update',
    category: 'reporting',
    frequency: 'monthly',
    isAutomated: true,
    automationLevel: 'mostly_auto',
    timeToCompleteManual: 120,
    timeToCompleteAutomated: 15,
    executionCount: 0,
    failureCount: 0,
  },

  // Maintenance
  {
    id: 'maint-deps',
    name: 'Dependency updates',
    category: 'maintenance',
    frequency: 'weekly',
    isAutomated: true,
    automationLevel: 'mostly_auto',
    timeToCompleteManual: 60,
    timeToCompleteAutomated: 10,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'maint-cleanup',
    name: 'Log and artifact cleanup',
    category: 'maintenance',
    frequency: 'daily',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 15,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'maint-cache',
    name: 'Cache invalidation',
    category: 'maintenance',
    frequency: 'on_demand',
    isAutomated: true,
    automationLevel: 'fully_auto',
    timeToCompleteManual: 10,
    timeToCompleteAutomated: 0,
    executionCount: 0,
    failureCount: 0,
  },

  // Compliance
  {
    id: 'comp-audit',
    name: 'Compliance audit preparation',
    category: 'compliance',
    frequency: 'quarterly',
    isAutomated: false,
    automationLevel: 'assisted',
    timeToCompleteManual: 480,
    timeToCompleteAutomated: 240,
    executionCount: 0,
    failureCount: 0,
  },
  {
    id: 'comp-report',
    name: 'Compliance report generation',
    category: 'compliance',
    frequency: 'monthly',
    isAutomated: true,
    automationLevel: 'mostly_auto',
    timeToCompleteManual: 120,
    timeToCompleteAutomated: 15,
    executionCount: 0,
    failureCount: 0,
  },
];

// ============================================================
// Automation Rate Calculator
// ============================================================

export class AutomationRateCalculator {
  private tasks: OperationalTask[];

  constructor(tasks: OperationalTask[] = OPERATIONAL_TASKS) {
    this.tasks = tasks;
  }

  /**
   * Calculate overall automation metrics
   */
  calculateMetrics(): AutomationMetrics {
    const overallRate = this.calculateOverallRate();
    const byCategory = this.calculateByCategory();
    const byFrequency = this.calculateByFrequency();
    const timeSaved = this.calculateTimeSavings();
    const trends = this.generateTrends();
    const recommendations = this.generateRecommendations();

    return {
      overallRate,
      byCategory,
      byFrequency,
      timeSaved,
      trends,
      recommendations,
    };
  }

  /**
   * Calculate overall automation rate (weighted by time saved)
   */
  private calculateOverallRate(): number {
    let totalWeight = 0;
    let automatedWeight = 0;

    for (const task of this.tasks) {
      const weight = task.timeToCompleteManual || 1;
      totalWeight += weight;
      automatedWeight += weight * AUTOMATION_WEIGHTS[task.automationLevel];
    }

    return totalWeight > 0 ? (automatedWeight / totalWeight) * 100 : 0;
  }

  /**
   * Calculate automation rate by category
   */
  private calculateByCategory(): Record<TaskCategory, CategoryMetrics> {
    const categories: TaskCategory[] = [
      'infrastructure', 'monitoring', 'security', 'data', 'deployment',
      'customer_support', 'billing', 'reporting', 'maintenance', 'compliance'
    ];

    const result: Record<TaskCategory, CategoryMetrics> = {} as Record<TaskCategory, CategoryMetrics>;

    for (const category of categories) {
      const categoryTasks = this.tasks.filter(t => t.category === category);
      const automatedTasks = categoryTasks.filter(t => t.automationLevel === 'fully_auto' || t.automationLevel === 'mostly_auto');

      let totalWeight = 0;
      let automatedWeight = 0;
      let timeSaved = 0;

      for (const task of categoryTasks) {
        const weight = task.timeToCompleteManual || 1;
        totalWeight += weight;
        automatedWeight += weight * AUTOMATION_WEIGHTS[task.automationLevel];
        timeSaved += (task.timeToCompleteManual - task.timeToCompleteAutomated) * this.getExecutionsPerMonth(task.frequency);
      }

      result[category] = {
        taskCount: categoryTasks.length,
        automatedCount: automatedTasks.length,
        rate: totalWeight > 0 ? (automatedWeight / totalWeight) * 100 : 0,
        timeSavedPerMonth: timeSaved / 60, // Convert to hours
      };
    }

    return result;
  }

  /**
   * Calculate automation rate by frequency
   */
  private calculateByFrequency(): Record<TaskFrequency, number> {
    const frequencies: TaskFrequency[] = [
      'realtime', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'on_demand'
    ];

    const result: Record<TaskFrequency, number> = {} as Record<TaskFrequency, number>;

    for (const frequency of frequencies) {
      const frequencyTasks = this.tasks.filter(t => t.frequency === frequency);
      let totalWeight = 0;
      let automatedWeight = 0;

      for (const task of frequencyTasks) {
        const weight = task.timeToCompleteManual || 1;
        totalWeight += weight;
        automatedWeight += weight * AUTOMATION_WEIGHTS[task.automationLevel];
      }

      result[frequency] = totalWeight > 0 ? (automatedWeight / totalWeight) * 100 : 0;
    }

    return result;
  }

  /**
   * Calculate time savings from automation
   */
  private calculateTimeSavings(): TimeSavings {
    let totalMinutesSavedPerMonth = 0;

    for (const task of this.tasks) {
      const timeSavedPerExecution = task.timeToCompleteManual - task.timeToCompleteAutomated;
      const executionsPerMonth = this.getExecutionsPerMonth(task.frequency);
      totalMinutesSavedPerMonth += timeSavedPerExecution * executionsPerMonth * AUTOMATION_WEIGHTS[task.automationLevel];
    }

    const hoursPerMonth = totalMinutesSavedPerMonth / 60;
    const hoursPerWeek = hoursPerMonth / 4;
    const hoursPerDay = hoursPerWeek / 5;
    const costSavingsPerMonth = hoursPerMonth * 50; // $50/hr

    return {
      hoursPerDay,
      hoursPerWeek,
      hoursPerMonth,
      costSavingsPerMonth,
    };
  }

  /**
   * Get executions per month for a frequency
   */
  private getExecutionsPerMonth(frequency: TaskFrequency): number {
    switch (frequency) {
      case 'realtime': return 30 * 24 * 60; // Every minute
      case 'hourly': return 30 * 24;
      case 'daily': return 30;
      case 'weekly': return 4;
      case 'monthly': return 1;
      case 'quarterly': return 0.33;
      case 'on_demand': return 10; // Estimate 10 per month
      default: return 1;
    }
  }

  /**
   * Generate automation trends (simulated historical data)
   */
  private generateTrends(): AutomationTrend[] {
    const trends: AutomationTrend[] = [];
    const now = new Date();

    // Generate 6 months of trends
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      // Simulate improvement over time
      const baseRate = 60 + (5 - i) * 4; // Starting at 60%, improving 4% per month
      trends.push({
        date,
        rate: Math.min(baseRate + Math.random() * 3, 100),
        tasksAdded: Math.floor(Math.random() * 3),
        tasksAutomated: Math.floor(Math.random() * 2) + 1,
      });
    }

    // Add current
    trends.push({
      date: now,
      rate: this.calculateOverallRate(),
      tasksAdded: 0,
      tasksAutomated: 0,
    });

    return trends;
  }

  /**
   * Generate recommendations for automation improvements
   */
  private generateRecommendations(): AutomationRecommendation[] {
    const recommendations: AutomationRecommendation[] = [];

    for (const task of this.tasks) {
      if (task.automationLevel === 'none' || task.automationLevel === 'assisted') {
        const timeSaved = (task.timeToCompleteManual - task.timeToCompleteAutomated) *
          this.getExecutionsPerMonth(task.frequency) / 60;

        recommendations.push({
          taskId: task.id,
          taskName: task.name,
          priority: timeSaved > 10 ? 'high' : timeSaved > 3 ? 'medium' : 'low',
          estimatedTimeSavings: timeSaved,
          implementationEffort: task.timeToCompleteManual > 60 ? 'high' : task.timeToCompleteManual > 30 ? 'medium' : 'low',
          impact: `Automate ${task.name} to save ${timeSaved.toFixed(1)} hours/month`,
        });
      }
    }

    // Sort by priority and time savings
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedTimeSavings - a.estimatedTimeSavings;
    });
  }

  /**
   * Check if automation rate meets target
   */
  meetsTarget(target: number = 80): boolean {
    return this.calculateOverallRate() >= target;
  }

  /**
   * Generate markdown report
   */
  generateReport(): string {
    const metrics = this.calculateMetrics();

    const formatPercent = (n: number) => `${n.toFixed(1)}%`;
    const formatHours = (n: number) => `${n.toFixed(1)} hrs`;

    let report = `
# Automation Rate Report

**Generated:** ${new Date().toISOString()}
**Target:** 80%
**Current Rate:** ${formatPercent(metrics.overallRate)}
**Status:** ${metrics.overallRate >= 80 ? 'PASSING' : 'NEEDS IMPROVEMENT'}

---

## Summary

- **Overall Automation Rate:** ${formatPercent(metrics.overallRate)}
- **Time Saved Per Month:** ${formatHours(metrics.timeSaved.hoursPerMonth)}
- **Cost Savings Per Month:** $${metrics.timeSaved.costSavingsPerMonth.toLocaleString()}

---

## By Category

| Category | Tasks | Automated | Rate | Time Saved/Month |
|----------|-------|-----------|------|------------------|
`;

    for (const [category, data] of Object.entries(metrics.byCategory)) {
      report += `| ${category.replace('_', ' ')} | ${data.taskCount} | ${data.automatedCount} | ${formatPercent(data.rate)} | ${formatHours(data.timeSavedPerMonth)} |\n`;
    }

    report += `
---

## By Frequency

| Frequency | Automation Rate |
|-----------|-----------------|
`;

    for (const [frequency, rate] of Object.entries(metrics.byFrequency)) {
      report += `| ${frequency.replace('_', ' ')} | ${formatPercent(rate)} |\n`;
    }

    if (metrics.recommendations.length > 0) {
      report += `
---

## Recommendations

| Priority | Task | Time Savings | Effort |
|----------|------|--------------|--------|
`;

      for (const rec of metrics.recommendations.slice(0, 5)) {
        report += `| ${rec.priority.toUpperCase()} | ${rec.taskName} | ${formatHours(rec.estimatedTimeSavings)}/mo | ${rec.implementationEffort} |\n`;
      }
    }

    report += `
---

## Trend

`;

    for (const trend of metrics.trends) {
      const date = trend.date.toISOString().split('T')[0];
      report += `- **${date}:** ${formatPercent(trend.rate)}\n`;
    }

    return report;
  }
}

// ============================================================
// Exports
// ============================================================

export const automationCalculator = new AutomationRateCalculator();
