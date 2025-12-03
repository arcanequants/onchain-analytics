/**
 * SOC 2 Gap Assessment
 *
 * Evaluates compliance with SOC 2 Type II controls
 * across the Trust Service Criteria (TSC)
 *
 * @module lib/security/soc2-gap-assessment
 */

// ============================================================
// Types
// ============================================================

export interface SOC2Control {
  id: string;
  category: TrustServiceCategory;
  title: string;
  description: string;
  status: ControlStatus;
  evidence: string[];
  gaps: string[];
  remediationPlan?: RemediationPlan;
  owner: string;
  lastAssessed: Date;
}

export type TrustServiceCategory =
  | 'security'
  | 'availability'
  | 'processing_integrity'
  | 'confidentiality'
  | 'privacy';

export type ControlStatus =
  | 'compliant'        // Fully implemented and tested
  | 'partial'          // Partially implemented
  | 'non_compliant'    // Not implemented
  | 'not_applicable';  // Does not apply

export interface RemediationPlan {
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  targetDate: Date;
  assignee: string;
}

export interface GapAssessmentResult {
  assessmentDate: Date;
  overallScore: number;
  readinessLevel: ReadinessLevel;
  byCategory: Record<TrustServiceCategory, CategoryScore>;
  controls: SOC2Control[];
  criticalGaps: SOC2Control[];
  recommendations: Recommendation[];
  nextSteps: string[];
}

export type ReadinessLevel =
  | 'not_ready'      // <50%
  | 'needs_work'     // 50-70%
  | 'nearly_ready'   // 70-90%
  | 'audit_ready';   // >90%

export interface CategoryScore {
  total: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  score: number;
}

export interface Recommendation {
  category: TrustServiceCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  effort: string;
}

// ============================================================
// SOC 2 Controls Registry
// ============================================================

export const SOC2_CONTROLS: SOC2Control[] = [
  // ============================================================
  // SECURITY (CC - Common Criteria)
  // ============================================================

  // CC1 - Control Environment
  {
    id: 'CC1.1',
    category: 'security',
    title: 'Organizational Commitment to Integrity and Ethics',
    description: 'Management demonstrates commitment to integrity and ethical values',
    status: 'compliant',
    evidence: [
      'docs/company/mission-vision-values.md',
      'docs/legal/ethical-ai-principles.md',
    ],
    gaps: [],
    owner: 'CEO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC1.2',
    category: 'security',
    title: 'Board of Directors Oversight',
    description: 'Board exercises oversight of internal controls',
    status: 'partial',
    evidence: [],
    gaps: ['No formal board; advisory board not yet established'],
    remediationPlan: {
      description: 'Establish advisory board with security expertise',
      priority: 'medium',
      estimatedEffort: '3 months',
      targetDate: new Date('2025-06-01'),
      assignee: 'CEO',
    },
    owner: 'CEO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC1.3',
    category: 'security',
    title: 'Organizational Structure',
    description: 'Management establishes structure and reporting lines',
    status: 'compliant',
    evidence: [
      'docs/hr/organizational-structure.md',
      'docs/hr/first-engineer-role.md',
    ],
    gaps: [],
    owner: 'CEO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC1.4',
    category: 'security',
    title: 'Competence and Accountability',
    description: 'Organization demonstrates commitment to competence',
    status: 'compliant',
    evidence: [
      'docs/hr/scaling-triggers.md',
      'docs/engineering/TECHNICAL-DEBT-REGISTER.md',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },

  // CC2 - Communication and Information
  {
    id: 'CC2.1',
    category: 'security',
    title: 'Internal Communication',
    description: 'Organization communicates internal control information',
    status: 'compliant',
    evidence: [
      'docs/security/INFORMATION-SECURITY-POLICY.md',
      'docs/AI-GOVERNANCE-POLICY.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC2.2',
    category: 'security',
    title: 'External Communication',
    description: 'Organization communicates with external parties',
    status: 'compliant',
    evidence: [
      'public/.well-known/security.txt',
      'docs/security/ENTERPRISE-FAQ.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // CC3 - Risk Assessment
  {
    id: 'CC3.1',
    category: 'security',
    title: 'Risk Assessment Objectives',
    description: 'Organization specifies objectives with clarity',
    status: 'compliant',
    evidence: [
      'docs/strategy/STRATEGIC-PLAN-2025-2027.md',
      'docs/strategy/Q1-2025-OKRS.md',
    ],
    gaps: [],
    owner: 'CEO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC3.2',
    category: 'security',
    title: 'Risk Identification and Analysis',
    description: 'Organization identifies and analyzes risks',
    status: 'compliant',
    evidence: [
      'src/lib/security/risk-register.ts',
      'docs/strategy/risk-register.md',
      'docs/VENDOR-RISK-MATRIX.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC3.3',
    category: 'security',
    title: 'Fraud Risk Assessment',
    description: 'Organization considers potential for fraud',
    status: 'compliant',
    evidence: [
      'src/lib/security/abuse-detection.ts',
      'src/lib/security/device-fingerprinting.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC3.4',
    category: 'security',
    title: 'Change Management Risk',
    description: 'Organization identifies changes that could impact controls',
    status: 'compliant',
    evidence: [
      'src/lib/ai/drift/index.ts',
      'scripts/check-migration-compatibility.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },

  // CC4 - Monitoring Activities
  {
    id: 'CC4.1',
    category: 'security',
    title: 'Ongoing Monitoring',
    description: 'Organization selects and develops ongoing monitoring',
    status: 'compliant',
    evidence: [
      'src/lib/security/security-monitoring-dashboard.ts',
      'src/lib/mlops/slo-dashboard.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC4.2',
    category: 'security',
    title: 'Deficiency Evaluation',
    description: 'Organization evaluates and communicates deficiencies',
    status: 'compliant',
    evidence: [
      'docs/templates/POSTMORTEM-TEMPLATE.md',
      'docs/runbooks/AI-INCIDENT-RUNBOOKS.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // CC5 - Control Activities
  {
    id: 'CC5.1',
    category: 'security',
    title: 'Control Selection and Development',
    description: 'Organization selects control activities that mitigate risks',
    status: 'compliant',
    evidence: [
      'docs/security/ACCESS-CONTROL-POLICY.md',
      'src/lib/rate-limit.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC5.2',
    category: 'security',
    title: 'Technology General Controls',
    description: 'Organization selects technology controls',
    status: 'compliant',
    evidence: [
      '.github/workflows/security.yml',
      'src/lib/security/jailbreak-detection.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC5.3',
    category: 'security',
    title: 'Policy Deployment',
    description: 'Organization deploys controls through policies',
    status: 'compliant',
    evidence: [
      'docs/security/INFORMATION-SECURITY-POLICY.md',
      'docs/security/DATA-CLASSIFICATION-POLICY.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // CC6 - Logical and Physical Access Controls
  {
    id: 'CC6.1',
    category: 'security',
    title: 'Logical Access Security',
    description: 'Organization implements logical access security',
    status: 'compliant',
    evidence: [
      'src/lib/security/session-security.ts',
      'src/lib/security/api-key-rotation.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.2',
    category: 'security',
    title: 'Authentication and Authorization',
    description: 'Prior to access, users are authenticated and authorized',
    status: 'compliant',
    evidence: [
      'src/lib/auth/',
      'src/lib/stripe/plan-enforcement.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.3',
    category: 'security',
    title: 'Access Removal',
    description: 'Organization removes access when no longer required',
    status: 'compliant',
    evidence: [
      'src/lib/data/gdpr-deletion.ts',
      'src/lib/security/service-accounts.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.4',
    category: 'security',
    title: 'Physical Access Restrictions',
    description: 'Organization restricts physical access',
    status: 'not_applicable',
    evidence: [],
    gaps: ['Cloud-only infrastructure - no physical access to manage'],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.5',
    category: 'security',
    title: 'Data Protection in Transit',
    description: 'Organization protects data in transit',
    status: 'compliant',
    evidence: [
      'next.config.js (security headers)',
      'TLS 1.3 enforced on all connections',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.6',
    category: 'security',
    title: 'Data Protection at Rest',
    description: 'Organization protects data at rest',
    status: 'compliant',
    evidence: [
      'Supabase encryption at rest',
      'docs/security/DATA-CLASSIFICATION-POLICY.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.7',
    category: 'security',
    title: 'Endpoint Security',
    description: 'Organization protects endpoints',
    status: 'partial',
    evidence: [
      'docs/security/INFORMATION-SECURITY-POLICY.md',
    ],
    gaps: ['No MDM for developer devices yet'],
    remediationPlan: {
      description: 'Implement MDM when team grows to 3+ engineers',
      priority: 'low',
      estimatedEffort: '1 month',
      targetDate: new Date('2025-09-01'),
      assignee: 'CISO',
    },
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC6.8',
    category: 'security',
    title: 'Change Management',
    description: 'Organization implements change management',
    status: 'compliant',
    evidence: [
      '.github/workflows/ci.yml',
      'docs/devsecops/branch-protection-rules.md',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },

  // CC7 - System Operations
  {
    id: 'CC7.1',
    category: 'security',
    title: 'Vulnerability Detection',
    description: 'Organization detects and monitors vulnerabilities',
    status: 'compliant',
    evidence: [
      'src/lib/security/vulnerability-management.ts',
      '.github/workflows/security.yml',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC7.2',
    category: 'security',
    title: 'Anomaly Detection',
    description: 'Organization monitors for anomalies',
    status: 'compliant',
    evidence: [
      'src/lib/security/abuse-detection.ts',
      'src/lib/ai/behavioral/drift-detection.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC7.3',
    category: 'security',
    title: 'Security Event Evaluation',
    description: 'Organization evaluates security events',
    status: 'compliant',
    evidence: [
      'src/lib/ai/incidents/incident-logger.ts',
      'src/lib/security/incident-metrics.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC7.4',
    category: 'security',
    title: 'Incident Response',
    description: 'Organization responds to security incidents',
    status: 'compliant',
    evidence: [
      'docs/runbooks/AI-INCIDENT-RUNBOOKS.md',
      'docs/security/INCIDENT-COMMUNICATION-PLAN.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC7.5',
    category: 'security',
    title: 'Incident Recovery',
    description: 'Organization identifies and recovers from incidents',
    status: 'compliant',
    evidence: [
      'docs/security/BUSINESS-CONTINUITY-PLAN.md',
      'docs/security/DR-DRILL-RUNBOOK.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // CC8 - Change Management
  {
    id: 'CC8.1',
    category: 'security',
    title: 'Infrastructure and Software Changes',
    description: 'Organization authorizes and manages changes',
    status: 'compliant',
    evidence: [
      '.github/workflows/ci.yml',
      'supabase/migrations/ROLLBACK-GUIDE.md',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },

  // CC9 - Risk Mitigation
  {
    id: 'CC9.1',
    category: 'security',
    title: 'Risk Mitigation Activities',
    description: 'Organization mitigates risks through controls',
    status: 'compliant',
    evidence: [
      'src/lib/security/risk-register.ts',
      'docs/VENDOR-RISK-MATRIX.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'CC9.2',
    category: 'security',
    title: 'Vendor Risk Management',
    description: 'Organization assesses and manages vendor risks',
    status: 'partial',
    evidence: [
      'docs/VENDOR-RISK-MATRIX.md',
    ],
    gaps: ['Need to verify Tier 1 vendor SOC 2 reports'],
    remediationPlan: {
      description: 'Request and review SOC 2 reports from OpenAI, Anthropic, Supabase',
      priority: 'high',
      estimatedEffort: '1 week',
      targetDate: new Date('2025-01-15'),
      assignee: 'CISO',
    },
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // ============================================================
  // AVAILABILITY (A)
  // ============================================================
  {
    id: 'A1.1',
    category: 'availability',
    title: 'Capacity Planning',
    description: 'Organization maintains capacity to meet commitments',
    status: 'compliant',
    evidence: [
      'src/lib/capacity/monitor.ts',
      'Vercel auto-scaling',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'A1.2',
    category: 'availability',
    title: 'Environmental Protections',
    description: 'Organization protects against environmental threats',
    status: 'not_applicable',
    evidence: [],
    gaps: ['Cloud infrastructure - vendor responsibility'],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'A1.3',
    category: 'availability',
    title: 'Recovery Procedures',
    description: 'Organization has recovery procedures',
    status: 'compliant',
    evidence: [
      'docs/security/BUSINESS-CONTINUITY-PLAN.md',
      'docs/runbooks/ROLLBACK-DRILL-RUNBOOK.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // ============================================================
  // PROCESSING INTEGRITY (PI)
  // ============================================================
  {
    id: 'PI1.1',
    category: 'processing_integrity',
    title: 'Processing Accuracy',
    description: 'Organization validates processing accuracy',
    status: 'compliant',
    evidence: [
      'src/lib/data/data-quality.ts',
      'src/lib/ai/golden-dataset.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'PI1.2',
    category: 'processing_integrity',
    title: 'Processing Completeness',
    description: 'Organization ensures processing completeness',
    status: 'compliant',
    evidence: [
      'src/lib/data/dq-runner.ts',
      'src/lib/mlops/dead-letter-queue.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'PI1.3',
    category: 'processing_integrity',
    title: 'Processing Timeliness',
    description: 'Organization ensures timely processing',
    status: 'compliant',
    evidence: [
      'src/lib/mlops/slo-dashboard.ts',
      'src/lib/performance/api-latency-monitor.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'PI1.4',
    category: 'processing_integrity',
    title: 'Output Validation',
    description: 'Organization validates outputs',
    status: 'compliant',
    evidence: [
      'src/lib/ai/response-parser.ts',
      'src/lib/hallucination-detection/index.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },

  // ============================================================
  // CONFIDENTIALITY (C)
  // ============================================================
  {
    id: 'C1.1',
    category: 'confidentiality',
    title: 'Confidential Information Identification',
    description: 'Organization identifies confidential information',
    status: 'compliant',
    evidence: [
      'docs/security/DATA-CLASSIFICATION-POLICY.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'C1.2',
    category: 'confidentiality',
    title: 'Confidential Information Disposal',
    description: 'Organization disposes of confidential information',
    status: 'compliant',
    evidence: [
      'src/lib/data/gdpr-deletion.ts',
      'src/app/api/cron/enforce-retention/route.ts',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },

  // ============================================================
  // PRIVACY (P)
  // ============================================================
  {
    id: 'P1.1',
    category: 'privacy',
    title: 'Privacy Notice',
    description: 'Organization provides privacy notice',
    status: 'compliant',
    evidence: [
      'Privacy Policy on website',
      'Cookie consent implementation',
    ],
    gaps: [],
    owner: 'Legal',
    lastAssessed: new Date(),
  },
  {
    id: 'P2.1',
    category: 'privacy',
    title: 'Consent and Choice',
    description: 'Organization obtains consent for personal information',
    status: 'compliant',
    evidence: [
      'Terms of Service acceptance',
      'Cookie consent banner',
    ],
    gaps: [],
    owner: 'Legal',
    lastAssessed: new Date(),
  },
  {
    id: 'P3.1',
    category: 'privacy',
    title: 'Collection Limitation',
    description: 'Organization limits collection to necessary data',
    status: 'compliant',
    evidence: [
      'Minimal data collection design',
      'docs/security/DATA-CLASSIFICATION-POLICY.md',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'P4.1',
    category: 'privacy',
    title: 'Use and Retention',
    description: 'Organization uses data only for stated purposes',
    status: 'compliant',
    evidence: [
      'src/app/api/cron/enforce-retention/route.ts',
      '90-day retention policy',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
  {
    id: 'P5.1',
    category: 'privacy',
    title: 'Data Subject Access',
    description: 'Organization provides access to personal information',
    status: 'compliant',
    evidence: [
      'src/lib/data/gdpr-deletion.ts',
      'Data export API',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'P6.1',
    category: 'privacy',
    title: 'Privacy Quality',
    description: 'Organization maintains accurate personal information',
    status: 'compliant',
    evidence: [
      'User profile editing',
      'src/lib/data/data-quality.ts',
    ],
    gaps: [],
    owner: 'CTO',
    lastAssessed: new Date(),
  },
  {
    id: 'P7.1',
    category: 'privacy',
    title: 'Privacy Monitoring',
    description: 'Organization monitors privacy compliance',
    status: 'compliant',
    evidence: [
      'src/lib/security/dlp-scanner.ts',
      'docs/legal/DATA-TRANSFER-IMPACT-ASSESSMENT.md',
    ],
    gaps: [],
    owner: 'CISO',
    lastAssessed: new Date(),
  },
];

// ============================================================
// SOC 2 Gap Assessment Engine
// ============================================================

export class SOC2GapAssessment {
  private controls: SOC2Control[];

  constructor(controls: SOC2Control[] = SOC2_CONTROLS) {
    this.controls = controls;
  }

  /**
   * Run full gap assessment
   */
  runAssessment(): GapAssessmentResult {
    const byCategory = this.scoreByCategory();
    const overallScore = this.calculateOverallScore(byCategory);
    const readinessLevel = this.getReadinessLevel(overallScore);
    const criticalGaps = this.getCriticalGaps();
    const recommendations = this.generateRecommendations();
    const nextSteps = this.generateNextSteps(readinessLevel);

    return {
      assessmentDate: new Date(),
      overallScore,
      readinessLevel,
      byCategory,
      controls: this.controls,
      criticalGaps,
      recommendations,
      nextSteps,
    };
  }

  /**
   * Score by category
   */
  private scoreByCategory(): Record<TrustServiceCategory, CategoryScore> {
    const categories: TrustServiceCategory[] = [
      'security', 'availability', 'processing_integrity', 'confidentiality', 'privacy'
    ];

    const result: Record<TrustServiceCategory, CategoryScore> = {} as Record<TrustServiceCategory, CategoryScore>;

    for (const category of categories) {
      const categoryControls = this.controls.filter(c => c.category === category);
      const applicable = categoryControls.filter(c => c.status !== 'not_applicable');
      const compliant = applicable.filter(c => c.status === 'compliant');
      const partial = applicable.filter(c => c.status === 'partial');
      const nonCompliant = applicable.filter(c => c.status === 'non_compliant');

      const score = applicable.length > 0 ?
        ((compliant.length + partial.length * 0.5) / applicable.length) * 100 : 100;

      result[category] = {
        total: categoryControls.length,
        compliant: compliant.length,
        partial: partial.length,
        nonCompliant: nonCompliant.length,
        score,
      };
    }

    return result;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(byCategory: Record<TrustServiceCategory, CategoryScore>): number {
    const scores = Object.values(byCategory);
    return scores.reduce((sum, cat) => sum + cat.score, 0) / scores.length;
  }

  /**
   * Get readiness level
   */
  private getReadinessLevel(score: number): ReadinessLevel {
    if (score >= 90) return 'audit_ready';
    if (score >= 70) return 'nearly_ready';
    if (score >= 50) return 'needs_work';
    return 'not_ready';
  }

  /**
   * Get critical gaps (non-compliant or partial with high priority)
   */
  private getCriticalGaps(): SOC2Control[] {
    return this.controls.filter(c =>
      c.status === 'non_compliant' ||
      (c.status === 'partial' && c.remediationPlan?.priority === 'critical')
    );
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const control of this.controls) {
      if (control.status === 'partial' || control.status === 'non_compliant') {
        recommendations.push({
          category: control.category,
          priority: control.remediationPlan?.priority || 'medium',
          title: control.title,
          description: control.gaps.join('; '),
          effort: control.remediationPlan?.estimatedEffort || 'TBD',
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Generate next steps based on readiness
   */
  private generateNextSteps(readiness: ReadinessLevel): string[] {
    switch (readiness) {
      case 'audit_ready':
        return [
          'Engage SOC 2 auditor for Type I assessment',
          'Prepare evidence documentation package',
          'Schedule management walkthrough',
          'Conduct pre-audit self-assessment',
        ];
      case 'nearly_ready':
        return [
          'Remediate remaining gaps (see recommendations)',
          'Conduct internal control testing',
          'Document evidence for all controls',
          'Begin auditor selection process',
        ];
      case 'needs_work':
        return [
          'Address critical gaps immediately',
          'Implement missing controls',
          'Document policies and procedures',
          'Establish monitoring and logging',
          'Re-assess in 30 days',
        ];
      case 'not_ready':
        return [
          'Prioritize security foundation',
          'Implement basic access controls',
          'Establish security policies',
          'Begin risk assessment process',
          'Consider hiring security expertise',
        ];
    }
  }

  /**
   * Generate markdown report
   */
  generateReport(): string {
    const result = this.runAssessment();
    const formatPercent = (n: number) => `${n.toFixed(1)}%`;

    let report = `
# SOC 2 Gap Assessment Report

**Assessment Date:** ${result.assessmentDate.toISOString().split('T')[0]}
**Overall Score:** ${formatPercent(result.overallScore)}
**Readiness Level:** ${result.readinessLevel.toUpperCase().replace('_', ' ')}

---

## Executive Summary

${result.readinessLevel === 'audit_ready' ? '**Status: READY FOR SOC 2 AUDIT**' : ''}
${result.readinessLevel === 'nearly_ready' ? '**Status: Nearly ready - minor remediation needed**' : ''}
${result.readinessLevel === 'needs_work' ? '**Status: Needs work - significant gaps remain**' : ''}
${result.readinessLevel === 'not_ready' ? '**Status: Not ready - foundational work required**' : ''}

---

## Scores by Trust Service Category

| Category | Score | Compliant | Partial | Non-Compliant |
|----------|-------|-----------|---------|---------------|
`;

    for (const [category, data] of Object.entries(result.byCategory)) {
      const displayCategory = category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
      report += `| ${displayCategory} | ${formatPercent(data.score)} | ${data.compliant} | ${data.partial} | ${data.nonCompliant} |\n`;
    }

    if (result.criticalGaps.length > 0) {
      report += `
---

## Critical Gaps

| Control | Title | Gap |
|---------|-------|-----|
`;
      for (const gap of result.criticalGaps) {
        report += `| ${gap.id} | ${gap.title} | ${gap.gaps.join('; ')} |\n`;
      }
    }

    if (result.recommendations.length > 0) {
      report += `
---

## Recommendations

| Priority | Category | Title | Effort |
|----------|----------|-------|--------|
`;
      for (const rec of result.recommendations.slice(0, 10)) {
        report += `| ${rec.priority.toUpperCase()} | ${rec.category} | ${rec.title} | ${rec.effort} |\n`;
      }
    }

    report += `
---

## Next Steps

`;
    for (const step of result.nextSteps) {
      report += `1. ${step}\n`;
    }

    report += `
---

## Control Details

### Compliant Controls (${this.controls.filter(c => c.status === 'compliant').length})

`;

    for (const control of this.controls.filter(c => c.status === 'compliant').slice(0, 10)) {
      report += `- **${control.id}**: ${control.title}\n`;
    }

    report += `
### Partial Controls (${this.controls.filter(c => c.status === 'partial').length})

`;

    for (const control of this.controls.filter(c => c.status === 'partial')) {
      report += `- **${control.id}**: ${control.title} - *${control.gaps.join('; ')}*\n`;
    }

    report += `
---

*This assessment is based on self-evaluation. A formal SOC 2 audit should be conducted by an accredited auditor.*
`;

    return report;
  }
}

// ============================================================
// Exports
// ============================================================

export const soc2Assessment = new SOC2GapAssessment();
