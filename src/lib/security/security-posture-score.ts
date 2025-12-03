/**
 * Security Posture Score Calculator
 *
 * Calculates an aggregate security posture score (target: >80/100)
 * based on multiple security control categories.
 */

export type ControlStatus = 'implemented' | 'partial' | 'planned' | 'not_applicable';

export interface SecurityControl {
  id: string;
  name: string;
  description: string;
  category: SecurityCategory;
  weight: number; // 1-10, how important this control is
  status: ControlStatus;
  score: number; // 0-100 for this specific control
  evidence?: string;
  lastAssessed: Date;
}

export type SecurityCategory =
  | 'access_control'
  | 'data_protection'
  | 'network_security'
  | 'application_security'
  | 'incident_response'
  | 'compliance'
  | 'vendor_management'
  | 'infrastructure'
  | 'monitoring'
  | 'business_continuity';

export interface CategoryScore {
  category: SecurityCategory;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  controls: SecurityControl[];
}

export interface SecurityPostureResult {
  overallScore: number;
  targetScore: number;
  meetsTarget: boolean;
  categoryScores: CategoryScore[];
  criticalFindings: SecurityControl[];
  recommendations: string[];
  assessmentDate: Date;
  nextAssessmentDue: Date;
}

// Security controls based on industry best practices and SOC 2 requirements
export const SECURITY_CONTROLS: SecurityControl[] = [
  // Access Control (15% weight)
  {
    id: 'AC-001',
    name: 'Multi-Factor Authentication',
    description: 'MFA required for all admin and developer access',
    category: 'access_control',
    weight: 10,
    status: 'implemented',
    score: 100,
    evidence: 'GitHub, Supabase, Vercel all require MFA',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AC-002',
    name: 'Role-Based Access Control',
    description: 'RBAC implemented for application access',
    category: 'access_control',
    weight: 9,
    status: 'implemented',
    score: 100,
    evidence: 'Supabase RLS + custom RBAC in application',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AC-003',
    name: 'Least Privilege Access',
    description: 'Users have minimum required permissions',
    category: 'access_control',
    weight: 8,
    status: 'implemented',
    score: 90,
    evidence: 'Service role key restricted, API keys scoped',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AC-004',
    name: 'Access Reviews',
    description: 'Regular access reviews conducted quarterly',
    category: 'access_control',
    weight: 7,
    status: 'partial',
    score: 60,
    evidence: 'Process defined, first review pending',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AC-005',
    name: 'Password Policy',
    description: 'Strong password requirements enforced',
    category: 'access_control',
    weight: 7,
    status: 'implemented',
    score: 100,
    evidence: 'Minimum 12 chars, complexity enforced via Supabase',
    lastAssessed: new Date('2024-12-01'),
  },

  // Data Protection (20% weight)
  {
    id: 'DP-001',
    name: 'Encryption at Rest',
    description: 'All data encrypted at rest',
    category: 'data_protection',
    weight: 10,
    status: 'implemented',
    score: 100,
    evidence: 'Supabase uses AES-256 encryption',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'DP-002',
    name: 'Encryption in Transit',
    description: 'All data encrypted in transit (TLS 1.3)',
    category: 'data_protection',
    weight: 10,
    status: 'implemented',
    score: 100,
    evidence: 'TLS 1.3 enforced, HSTS enabled',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'DP-003',
    name: 'Data Classification',
    description: 'Data classification scheme implemented',
    category: 'data_protection',
    weight: 7,
    status: 'implemented',
    score: 85,
    evidence: 'Public/Internal/Confidential/Restricted scheme',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'DP-004',
    name: 'Data Retention',
    description: 'Data retention policies defined and enforced',
    category: 'data_protection',
    weight: 6,
    status: 'implemented',
    score: 90,
    evidence: 'Automated cleanup cron job for old data',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'DP-005',
    name: 'Backup Encryption',
    description: 'Backups encrypted and tested',
    category: 'data_protection',
    weight: 8,
    status: 'implemented',
    score: 95,
    evidence: 'Supabase PITR with encrypted backups',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'DP-006',
    name: 'PII Minimization',
    description: 'Minimal PII collected and stored',
    category: 'data_protection',
    weight: 8,
    status: 'implemented',
    score: 100,
    evidence: 'Only email required, no wallet connections',
    lastAssessed: new Date('2024-12-01'),
  },

  // Network Security (10% weight)
  {
    id: 'NS-001',
    name: 'WAF Protection',
    description: 'Web Application Firewall enabled',
    category: 'network_security',
    weight: 8,
    status: 'implemented',
    score: 100,
    evidence: 'Vercel Edge + Cloudflare protection',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'NS-002',
    name: 'DDoS Protection',
    description: 'DDoS mitigation in place',
    category: 'network_security',
    weight: 8,
    status: 'implemented',
    score: 100,
    evidence: 'Vercel/Cloudflare DDoS protection',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'NS-003',
    name: 'Rate Limiting',
    description: 'API rate limiting implemented',
    category: 'network_security',
    weight: 7,
    status: 'implemented',
    score: 90,
    evidence: 'Upstash rate limiting on API routes',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'NS-004',
    name: 'Network Segmentation',
    description: 'Production/staging/dev environments isolated',
    category: 'network_security',
    weight: 6,
    status: 'implemented',
    score: 85,
    evidence: 'Separate Vercel environments and Supabase projects',
    lastAssessed: new Date('2024-12-01'),
  },

  // Application Security (15% weight)
  {
    id: 'AS-001',
    name: 'Dependency Scanning',
    description: 'Automated dependency vulnerability scanning',
    category: 'application_security',
    weight: 9,
    status: 'implemented',
    score: 95,
    evidence: 'Dependabot + npm audit in CI',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AS-002',
    name: 'SAST',
    description: 'Static Application Security Testing',
    category: 'application_security',
    weight: 8,
    status: 'implemented',
    score: 85,
    evidence: 'ESLint security rules, TypeScript strict mode',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AS-003',
    name: 'Input Validation',
    description: 'All inputs validated and sanitized',
    category: 'application_security',
    weight: 9,
    status: 'implemented',
    score: 90,
    evidence: 'Zod validation, parameterized queries',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AS-004',
    name: 'Security Headers',
    description: 'Security headers properly configured',
    category: 'application_security',
    weight: 7,
    status: 'implemented',
    score: 100,
    evidence: 'CSP, HSTS, X-Frame-Options, etc.',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AS-005',
    name: 'Secret Management',
    description: 'Secrets properly managed, no hardcoding',
    category: 'application_security',
    weight: 10,
    status: 'implemented',
    score: 100,
    evidence: 'Vercel env vars, GitHub Secrets, no secrets in code',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'AS-006',
    name: 'SLSA Level 2',
    description: 'Supply chain security attestation',
    category: 'application_security',
    weight: 7,
    status: 'implemented',
    score: 100,
    evidence: 'SLSA provenance workflow implemented',
    lastAssessed: new Date('2024-12-01'),
  },

  // Incident Response (10% weight)
  {
    id: 'IR-001',
    name: 'Incident Response Plan',
    description: 'Documented incident response procedures',
    category: 'incident_response',
    weight: 9,
    status: 'implemented',
    score: 90,
    evidence: 'SECURITY-INCIDENT-RESPONSE.md documented',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'IR-002',
    name: 'Security Contact',
    description: 'Security contact publicized (security.txt)',
    category: 'incident_response',
    weight: 5,
    status: 'implemented',
    score: 100,
    evidence: 'security.txt with contact info',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'IR-003',
    name: 'Incident Drills',
    description: 'Regular incident response drills',
    category: 'incident_response',
    weight: 6,
    status: 'partial',
    score: 50,
    evidence: 'First drill scheduled for Q1 2025',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'IR-004',
    name: 'Forensic Readiness',
    description: 'Logs retained for forensic analysis',
    category: 'incident_response',
    weight: 6,
    status: 'implemented',
    score: 85,
    evidence: 'Sentry + Vercel logs retained 90 days',
    lastAssessed: new Date('2024-12-01'),
  },

  // Compliance (10% weight)
  {
    id: 'CO-001',
    name: 'SOC 2 Type II',
    description: 'SOC 2 Type II certification process',
    category: 'compliance',
    weight: 10,
    status: 'partial',
    score: 70,
    evidence: 'Gap assessment complete, audit scheduled Q2 2025',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'CO-002',
    name: 'GDPR Compliance',
    description: 'GDPR requirements implemented',
    category: 'compliance',
    weight: 8,
    status: 'implemented',
    score: 90,
    evidence: 'DPA, cookie consent, data deletion available',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'CO-003',
    name: 'Privacy Policy',
    description: 'Privacy policy published and maintained',
    category: 'compliance',
    weight: 6,
    status: 'implemented',
    score: 100,
    evidence: 'Privacy policy live, reviewed quarterly',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'CO-004',
    name: 'Terms of Service',
    description: 'ToS with appropriate disclaimers',
    category: 'compliance',
    weight: 6,
    status: 'implemented',
    score: 100,
    evidence: 'ToS includes investment disclaimers',
    lastAssessed: new Date('2024-12-01'),
  },

  // Vendor Management (5% weight)
  {
    id: 'VM-001',
    name: 'Vendor SOC 2 Verification',
    description: 'Critical vendors SOC 2 verified',
    category: 'vendor_management',
    weight: 8,
    status: 'implemented',
    score: 100,
    evidence: 'All Tier 1 vendors verified and documented',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'VM-002',
    name: 'Data Processing Agreements',
    description: 'DPAs signed with data processors',
    category: 'vendor_management',
    weight: 7,
    status: 'implemented',
    score: 100,
    evidence: 'DPAs with OpenAI, Anthropic, Supabase, Stripe, Vercel',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'VM-003',
    name: 'Vendor Risk Assessment',
    description: 'Regular vendor risk assessments',
    category: 'vendor_management',
    weight: 6,
    status: 'partial',
    score: 70,
    evidence: 'Initial assessment complete, annual review process defined',
    lastAssessed: new Date('2024-12-01'),
  },

  // Infrastructure (5% weight)
  {
    id: 'IN-001',
    name: 'Infrastructure as Code',
    description: 'Infrastructure defined as code',
    category: 'infrastructure',
    weight: 7,
    status: 'partial',
    score: 60,
    evidence: 'Vercel config in repo, Terraform planned',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'IN-002',
    name: 'Immutable Infrastructure',
    description: 'Deployments are immutable',
    category: 'infrastructure',
    weight: 6,
    status: 'implemented',
    score: 100,
    evidence: 'Vercel deployments are immutable',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'IN-003',
    name: 'Container Security',
    description: 'Container images scanned for vulnerabilities',
    category: 'infrastructure',
    weight: 5,
    status: 'not_applicable',
    score: 100,
    evidence: 'Serverless deployment, no containers',
    lastAssessed: new Date('2024-12-01'),
  },

  // Monitoring (5% weight)
  {
    id: 'MO-001',
    name: 'Security Monitoring',
    description: 'Security events monitored and alerted',
    category: 'monitoring',
    weight: 8,
    status: 'implemented',
    score: 85,
    evidence: 'Sentry, Vercel analytics, custom alerts',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'MO-002',
    name: 'Audit Logging',
    description: 'Security-relevant events logged',
    category: 'monitoring',
    weight: 7,
    status: 'implemented',
    score: 90,
    evidence: 'Auth events, API access, admin actions logged',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'MO-003',
    name: 'Alerting',
    description: 'Critical security alerts configured',
    category: 'monitoring',
    weight: 7,
    status: 'implemented',
    score: 85,
    evidence: 'Error rate alerts, auth failure alerts',
    lastAssessed: new Date('2024-12-01'),
  },

  // Business Continuity (5% weight)
  {
    id: 'BC-001',
    name: 'Disaster Recovery Plan',
    description: 'DR plan documented and tested',
    category: 'business_continuity',
    weight: 8,
    status: 'implemented',
    score: 85,
    evidence: 'DR runbook documented, drill scheduled',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'BC-002',
    name: 'Backup Testing',
    description: 'Regular backup restoration tests',
    category: 'business_continuity',
    weight: 7,
    status: 'partial',
    score: 70,
    evidence: 'First test completed, quarterly schedule set',
    lastAssessed: new Date('2024-12-01'),
  },
  {
    id: 'BC-003',
    name: 'RTO/RPO Defined',
    description: 'Recovery objectives defined and achievable',
    category: 'business_continuity',
    weight: 6,
    status: 'implemented',
    score: 100,
    evidence: 'RTO: 4 hours, RPO: 1 hour documented',
    lastAssessed: new Date('2024-12-01'),
  },
];

const CATEGORY_WEIGHTS: Record<SecurityCategory, { weight: number; name: string }> = {
  access_control: { weight: 0.15, name: 'Access Control' },
  data_protection: { weight: 0.20, name: 'Data Protection' },
  network_security: { weight: 0.10, name: 'Network Security' },
  application_security: { weight: 0.15, name: 'Application Security' },
  incident_response: { weight: 0.10, name: 'Incident Response' },
  compliance: { weight: 0.10, name: 'Compliance' },
  vendor_management: { weight: 0.05, name: 'Vendor Management' },
  infrastructure: { weight: 0.05, name: 'Infrastructure' },
  monitoring: { weight: 0.05, name: 'Monitoring' },
  business_continuity: { weight: 0.05, name: 'Business Continuity' },
};

export class SecurityPostureCalculator {
  private controls: SecurityControl[];
  private targetScore: number;

  constructor(controls: SecurityControl[] = SECURITY_CONTROLS, targetScore: number = 80) {
    this.controls = controls;
    this.targetScore = targetScore;
  }

  calculateCategoryScore(category: SecurityCategory): CategoryScore {
    const categoryControls = this.controls.filter(c => c.category === category);

    if (categoryControls.length === 0) {
      return {
        category,
        name: CATEGORY_WEIGHTS[category].name,
        score: 0,
        maxScore: 0,
        percentage: 100,
        controls: [],
      };
    }

    const totalWeight = categoryControls.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = categoryControls.reduce(
      (sum, c) => sum + (c.score * c.weight) / 100,
      0
    );
    const maxScore = totalWeight;
    const percentage = (weightedScore / maxScore) * 100;

    return {
      category,
      name: CATEGORY_WEIGHTS[category].name,
      score: weightedScore,
      maxScore,
      percentage: Math.round(percentage * 10) / 10,
      controls: categoryControls,
    };
  }

  calculateOverallScore(): SecurityPostureResult {
    const categoryScores: CategoryScore[] = [];
    let overallScore = 0;

    for (const category of Object.keys(CATEGORY_WEIGHTS) as SecurityCategory[]) {
      const categoryScore = this.calculateCategoryScore(category);
      categoryScores.push(categoryScore);
      overallScore += categoryScore.percentage * CATEGORY_WEIGHTS[category].weight;
    }

    overallScore = Math.round(overallScore * 10) / 10;

    // Find critical findings (controls with score < 70)
    const criticalFindings = this.controls.filter(c => c.score < 70);

    // Generate recommendations
    const recommendations = this.generateRecommendations(categoryScores, criticalFindings);

    return {
      overallScore,
      targetScore: this.targetScore,
      meetsTarget: overallScore >= this.targetScore,
      categoryScores,
      criticalFindings,
      recommendations,
      assessmentDate: new Date(),
      nextAssessmentDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
  }

  private generateRecommendations(
    categoryScores: CategoryScore[],
    criticalFindings: SecurityControl[]
  ): string[] {
    const recommendations: string[] = [];

    // Add recommendations for critical findings
    for (const finding of criticalFindings) {
      if (finding.score < 50) {
        recommendations.push(
          `CRITICAL: ${finding.name} (${finding.id}) needs immediate attention - current score: ${finding.score}%`
        );
      } else {
        recommendations.push(
          `IMPROVE: ${finding.name} (${finding.id}) - current score: ${finding.score}%`
        );
      }
    }

    // Add recommendations for weak categories
    for (const category of categoryScores) {
      if (category.percentage < 70) {
        recommendations.push(
          `CATEGORY: ${category.name} is below target at ${category.percentage}% - review all controls`
        );
      }
    }

    // Add general recommendations
    const partialControls = this.controls.filter(c => c.status === 'partial');
    if (partialControls.length > 0) {
      recommendations.push(
        `COMPLETE: ${partialControls.length} controls are partially implemented and should be fully implemented`
      );
    }

    return recommendations;
  }

  meetsTarget(): boolean {
    return this.calculateOverallScore().overallScore >= this.targetScore;
  }

  generateReport(): string {
    const result = this.calculateOverallScore();

    let report = '# Security Posture Assessment Report\n\n';
    report += `**Assessment Date:** ${result.assessmentDate.toISOString().split('T')[0]}\n`;
    report += `**Next Assessment Due:** ${result.nextAssessmentDue.toISOString().split('T')[0]}\n\n`;

    report += '## Overall Score\n\n';
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| **Overall Score** | **${result.overallScore}/100** |\n`;
    report += `| Target Score | ${result.targetScore}/100 |\n`;
    report += `| Status | ${result.meetsTarget ? 'PASS' : 'NEEDS IMPROVEMENT'} |\n\n`;

    report += '## Category Breakdown\n\n';
    report += '| Category | Score | Weight | Contribution |\n';
    report += '|----------|-------|--------|-------------|\n';

    for (const category of result.categoryScores) {
      const weight = CATEGORY_WEIGHTS[category.category].weight * 100;
      const contribution = (category.percentage * CATEGORY_WEIGHTS[category.category].weight).toFixed(1);
      report += `| ${category.name} | ${category.percentage}% | ${weight}% | ${contribution} |\n`;
    }

    report += '\n## Control Details\n\n';

    for (const category of result.categoryScores) {
      report += `### ${category.name}\n\n`;
      report += '| ID | Control | Status | Score |\n';
      report += '|----|---------|--------|-------|\n';

      for (const control of category.controls) {
        const statusEmoji = control.status === 'implemented' ? 'PASS' :
                           control.status === 'partial' ? 'PARTIAL' :
                           control.status === 'planned' ? 'PLANNED' : 'N/A';
        report += `| ${control.id} | ${control.name} | ${statusEmoji} | ${control.score}% |\n`;
      }
      report += '\n';
    }

    if (result.criticalFindings.length > 0) {
      report += '## Critical Findings\n\n';
      for (const finding of result.criticalFindings) {
        report += `- **${finding.id}**: ${finding.name} (${finding.score}%)\n`;
      }
      report += '\n';
    }

    if (result.recommendations.length > 0) {
      report += '## Recommendations\n\n';
      for (const rec of result.recommendations) {
        report += `- ${rec}\n`;
      }
    }

    return report;
  }
}

// Singleton calculator instance
export const securityPostureCalculator = new SecurityPostureCalculator();

// Quick access function
export function getSecurityPostureScore(): SecurityPostureResult {
  return securityPostureCalculator.calculateOverallScore();
}

// Report generation function
export function generateSecurityPostureReport(): string {
  return securityPostureCalculator.generateReport();
}
