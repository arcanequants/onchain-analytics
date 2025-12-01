/**
 * Regulatory Context Module
 * Phase 1, Week 2, Day 5 - Domain Tasks
 *
 * Provides regulatory compliance flags and context by industry vertical.
 * Includes HIPAA, PCI-DSS, SOC 2, GDPR, and other key regulations.
 */

// ================================================================
// TYPES
// ================================================================

export type RegulationId =
  | 'hipaa'
  | 'pci-dss'
  | 'soc2'
  | 'gdpr'
  | 'ccpa'
  | 'sox'
  | 'finra'
  | 'ferpa'
  | 'coppa'
  | 'ftc'
  | 'fda'
  | 'sec'
  | 'aml-kyc'
  | 'ada'
  | 'fair-housing'
  | 'can-spam'
  | 'state-bar'
  | 'iso-27001'
  | 'lgpd'
  | 'osha';

export type RegulationCategory =
  | 'data-privacy'
  | 'financial'
  | 'healthcare'
  | 'consumer-protection'
  | 'industry-specific'
  | 'accessibility'
  | 'security';

export type ComplianceLevel = 'mandatory' | 'recommended' | 'optional';

export interface Regulation {
  id: RegulationId;
  name: string;
  fullName: string;
  description: string;
  category: RegulationCategory;
  jurisdiction: string[];
  enforcementBody: string;
  penalties: string;
  keyRequirements: string[];
  complianceIndicators: string[];
}

export interface IndustryRegulation {
  regulationId: RegulationId;
  complianceLevel: ComplianceLevel;
  notes?: string;
  applicableWhen?: string;
}

export interface IndustryRegulatoryContext {
  industrySlug: string;
  industryName: string;
  regulations: IndustryRegulation[];
  complianceConsiderations: string[];
  promptContext: string;
}

// ================================================================
// REGULATION DEFINITIONS
// ================================================================

export const REGULATIONS: Record<RegulationId, Regulation> = {
  hipaa: {
    id: 'hipaa',
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act',
    description: 'US law that protects sensitive patient health information from being disclosed without consent.',
    category: 'healthcare',
    jurisdiction: ['US'],
    enforcementBody: 'HHS Office for Civil Rights (OCR)',
    penalties: 'Up to $1.5M per violation category per year, plus potential criminal penalties',
    keyRequirements: [
      'Privacy Rule compliance',
      'Security Rule implementation',
      'Breach notification procedures',
      'Business Associate Agreements (BAAs)',
      'Employee training requirements',
      'Minimum necessary standard'
    ],
    complianceIndicators: [
      'BAA offered/signed',
      'HIPAA compliance statement',
      'PHI handling policies',
      'Security certifications',
      'Breach notification procedures documented'
    ]
  },
  'pci-dss': {
    id: 'pci-dss',
    name: 'PCI-DSS',
    fullName: 'Payment Card Industry Data Security Standard',
    description: 'Security standard for organizations that handle branded credit cards.',
    category: 'financial',
    jurisdiction: ['Global'],
    enforcementBody: 'PCI Security Standards Council',
    penalties: 'Fines from $5,000 to $100,000 per month, plus liability for fraud losses',
    keyRequirements: [
      'Build and maintain secure networks',
      'Protect cardholder data',
      'Maintain vulnerability management program',
      'Implement strong access control',
      'Regular monitoring and testing',
      'Maintain information security policy'
    ],
    complianceIndicators: [
      'PCI-DSS certification level (1-4)',
      'Annual compliance validation',
      'Quarterly network scans',
      'Penetration testing reports',
      'SAQ completion'
    ]
  },
  soc2: {
    id: 'soc2',
    name: 'SOC 2',
    fullName: 'Service Organization Control 2',
    description: 'Auditing procedure ensuring service providers securely manage data based on five trust principles.',
    category: 'security',
    jurisdiction: ['US', 'Global'],
    enforcementBody: 'AICPA',
    penalties: 'No direct penalties; impacts customer trust and contract eligibility',
    keyRequirements: [
      'Security controls',
      'Availability commitments',
      'Processing integrity',
      'Confidentiality measures',
      'Privacy protections'
    ],
    complianceIndicators: [
      'SOC 2 Type I report',
      'SOC 2 Type II report',
      'Annual audit completion',
      'Trust services covered',
      'No exceptions in report'
    ]
  },
  gdpr: {
    id: 'gdpr',
    name: 'GDPR',
    fullName: 'General Data Protection Regulation',
    description: 'EU regulation on data protection and privacy for individuals within the EU and EEA.',
    category: 'data-privacy',
    jurisdiction: ['EU', 'EEA', 'UK (UK GDPR)'],
    enforcementBody: 'Data Protection Authorities (DPAs)',
    penalties: 'Up to €20M or 4% of global annual turnover, whichever is higher',
    keyRequirements: [
      'Lawful basis for processing',
      'Data subject rights (access, erasure, portability)',
      'Privacy by design and default',
      'Data Protection Impact Assessments',
      'Breach notification within 72 hours',
      'Data Protection Officer (for some orgs)'
    ],
    complianceIndicators: [
      'Privacy policy with GDPR provisions',
      'Cookie consent mechanism',
      'Data subject rights process',
      'DPO appointed',
      'Standard contractual clauses',
      'Records of processing activities'
    ]
  },
  ccpa: {
    id: 'ccpa',
    name: 'CCPA',
    fullName: 'California Consumer Privacy Act',
    description: 'California law enhancing privacy rights and consumer protection for residents.',
    category: 'data-privacy',
    jurisdiction: ['US - California'],
    enforcementBody: 'California Attorney General',
    penalties: 'Up to $7,500 per intentional violation, $2,500 per unintentional violation',
    keyRequirements: [
      'Right to know what data is collected',
      'Right to delete personal information',
      'Right to opt-out of data sale',
      'Right to non-discrimination',
      'Privacy policy disclosures'
    ],
    complianceIndicators: [
      'Do Not Sell My Info link',
      'CCPA privacy policy section',
      'Consumer request process',
      'Verification procedures',
      'Employee training'
    ]
  },
  sox: {
    id: 'sox',
    name: 'SOX',
    fullName: 'Sarbanes-Oxley Act',
    description: 'US law setting standards for public company boards, management, and accounting firms.',
    category: 'financial',
    jurisdiction: ['US'],
    enforcementBody: 'SEC, PCAOB',
    penalties: 'Criminal penalties up to $5M and 20 years imprisonment for willful violations',
    keyRequirements: [
      'CEO/CFO certification of financial reports',
      'Internal control requirements (Section 404)',
      'Audit committee independence',
      'Whistleblower protections',
      'Document retention requirements'
    ],
    complianceIndicators: [
      'Annual internal control audit',
      'Section 404 compliance',
      'Audit committee charter',
      'Code of ethics',
      'Financial reporting controls'
    ]
  },
  finra: {
    id: 'finra',
    name: 'FINRA',
    fullName: 'Financial Industry Regulatory Authority',
    description: 'Self-regulatory organization for broker-dealers in the US.',
    category: 'financial',
    jurisdiction: ['US'],
    enforcementBody: 'FINRA',
    penalties: 'Fines, suspensions, expulsion from industry',
    keyRequirements: [
      'Registration of representatives',
      'Conduct rules compliance',
      'Customer suitability requirements',
      'Advertising review',
      'Supervision systems'
    ],
    complianceIndicators: [
      'Broker registration (CRD)',
      'Compliance department',
      'Written supervisory procedures',
      'FINRA membership',
      'BrokerCheck record'
    ]
  },
  ferpa: {
    id: 'ferpa',
    name: 'FERPA',
    fullName: 'Family Educational Rights and Privacy Act',
    description: 'US law protecting the privacy of student education records.',
    category: 'data-privacy',
    jurisdiction: ['US'],
    enforcementBody: 'US Department of Education',
    penalties: 'Withdrawal of federal funding',
    keyRequirements: [
      'Parental consent for disclosure',
      'Student access to records',
      'Amendment rights',
      'Annual notification',
      'Directory information policies'
    ],
    complianceIndicators: [
      'FERPA compliance statement',
      'Student consent processes',
      'Record access procedures',
      'Directory information opt-out',
      'Staff training records'
    ]
  },
  coppa: {
    id: 'coppa',
    name: 'COPPA',
    fullName: "Children's Online Privacy Protection Act",
    description: 'US law protecting privacy of children under 13 online.',
    category: 'consumer-protection',
    jurisdiction: ['US'],
    enforcementBody: 'FTC',
    penalties: 'Up to $50,120 per violation',
    keyRequirements: [
      'Parental consent before collecting data',
      'Clear privacy policy',
      'Data minimization',
      'Parental review/deletion rights',
      'Data security measures'
    ],
    complianceIndicators: [
      'Age verification mechanism',
      'Parental consent process',
      'Child-specific privacy policy',
      'Data deletion procedures',
      'Safe harbor certification'
    ]
  },
  ftc: {
    id: 'ftc',
    name: 'FTC Act',
    fullName: 'Federal Trade Commission Act',
    description: 'US law prohibiting unfair or deceptive acts in commerce.',
    category: 'consumer-protection',
    jurisdiction: ['US'],
    enforcementBody: 'Federal Trade Commission',
    penalties: 'Civil penalties up to $50,120 per violation',
    keyRequirements: [
      'Truthful advertising',
      'Endorsement disclosures',
      'Privacy promise keeping',
      'Data security requirements',
      'Unfair practice prevention'
    ],
    complianceIndicators: [
      'Clear disclosures',
      'Substantiated claims',
      'Endorsement compliance',
      'Privacy policy adherence',
      'Reasonable security practices'
    ]
  },
  fda: {
    id: 'fda',
    name: 'FDA',
    fullName: 'Food and Drug Administration Regulations',
    description: 'US agency regulations for food, drugs, medical devices, and cosmetics.',
    category: 'industry-specific',
    jurisdiction: ['US'],
    enforcementBody: 'FDA',
    penalties: 'Seizure, injunction, criminal prosecution, civil penalties',
    keyRequirements: [
      'Product registration',
      'Good Manufacturing Practices',
      'Labeling requirements',
      'Adverse event reporting',
      'Pre-market approval (where required)'
    ],
    complianceIndicators: [
      'FDA registration number',
      'GMP compliance',
      'Product labeling compliance',
      'Recall procedures',
      'Adverse event reporting system'
    ]
  },
  sec: {
    id: 'sec',
    name: 'SEC',
    fullName: 'Securities and Exchange Commission Regulations',
    description: 'US agency regulations for securities markets and investor protection.',
    category: 'financial',
    jurisdiction: ['US'],
    enforcementBody: 'SEC',
    penalties: 'Civil penalties, disgorgement, injunctions, criminal referral',
    keyRequirements: [
      'Registration requirements',
      'Disclosure obligations',
      'Anti-fraud provisions',
      'Insider trading prohibitions',
      'Proxy rules'
    ],
    complianceIndicators: [
      'SEC registration',
      'Periodic filings (10-K, 10-Q)',
      'Material event disclosures',
      'Insider trading policies',
      'Whistleblower program'
    ]
  },
  'aml-kyc': {
    id: 'aml-kyc',
    name: 'AML/KYC',
    fullName: 'Anti-Money Laundering / Know Your Customer',
    description: 'Regulations requiring financial institutions to verify customer identity and monitor transactions.',
    category: 'financial',
    jurisdiction: ['Global'],
    enforcementBody: 'FinCEN (US), FCA (UK), various national regulators',
    penalties: 'Significant fines (billions of dollars for major violations), license revocation',
    keyRequirements: [
      'Customer identification program',
      'Customer due diligence',
      'Enhanced due diligence for high-risk',
      'Transaction monitoring',
      'Suspicious activity reporting',
      'Record keeping'
    ],
    complianceIndicators: [
      'KYC verification process',
      'AML compliance officer',
      'Transaction monitoring system',
      'SAR filing procedures',
      'Risk-based approach documentation'
    ]
  },
  ada: {
    id: 'ada',
    name: 'ADA',
    fullName: 'Americans with Disabilities Act',
    description: 'US law prohibiting discrimination against individuals with disabilities.',
    category: 'accessibility',
    jurisdiction: ['US'],
    enforcementBody: 'DOJ, EEOC',
    penalties: 'Civil penalties up to $75,000 first violation, $150,000 subsequent',
    keyRequirements: [
      'Physical accessibility',
      'Website accessibility (Title III)',
      'Reasonable accommodations',
      'Non-discrimination policies',
      'Effective communication'
    ],
    complianceIndicators: [
      'WCAG compliance',
      'Accessibility statement',
      'Physical accessibility features',
      'Accommodation request process',
      'Staff training'
    ]
  },
  'fair-housing': {
    id: 'fair-housing',
    name: 'Fair Housing Act',
    fullName: 'Fair Housing Act',
    description: 'US law prohibiting discrimination in housing based on protected characteristics.',
    category: 'industry-specific',
    jurisdiction: ['US'],
    enforcementBody: 'HUD, DOJ',
    penalties: 'Civil penalties up to $21,663 first violation, higher for repeat offenders',
    keyRequirements: [
      'Non-discriminatory practices',
      'Fair advertising',
      'Reasonable accommodations',
      'Equal opportunity lending',
      'Record keeping'
    ],
    complianceIndicators: [
      'Fair housing policy',
      'Equal Housing Opportunity logo',
      'Non-discriminatory advertising',
      'Staff training records',
      'Complaint handling process'
    ]
  },
  'can-spam': {
    id: 'can-spam',
    name: 'CAN-SPAM',
    fullName: 'Controlling the Assault of Non-Solicited Pornography And Marketing Act',
    description: 'US law setting rules for commercial email and messaging.',
    category: 'consumer-protection',
    jurisdiction: ['US'],
    enforcementBody: 'FTC',
    penalties: 'Up to $50,120 per violation',
    keyRequirements: [
      'Accurate header information',
      'Non-deceptive subject lines',
      'Clear advertisement identification',
      'Physical address inclusion',
      'Opt-out mechanism',
      'Honor opt-outs promptly'
    ],
    complianceIndicators: [
      'Unsubscribe link',
      'Physical address in emails',
      'Opt-out processing within 10 days',
      'Sender identification',
      'Third-party compliance monitoring'
    ]
  },
  'state-bar': {
    id: 'state-bar',
    name: 'State Bar Rules',
    fullName: 'State Bar Professional Conduct Rules',
    description: 'State-specific rules governing attorney conduct and ethics.',
    category: 'industry-specific',
    jurisdiction: ['US - State specific'],
    enforcementBody: 'State Bar Associations',
    penalties: 'Disciplinary actions including disbarment',
    keyRequirements: [
      'Attorney licensing',
      'Competent representation',
      'Client confidentiality',
      'Conflict of interest rules',
      'Trust account management',
      'Advertising rules'
    ],
    complianceIndicators: [
      'Active bar license',
      'Good standing status',
      'No disciplinary history',
      'CLE compliance',
      'Trust account audits'
    ]
  },
  'iso-27001': {
    id: 'iso-27001',
    name: 'ISO 27001',
    fullName: 'ISO/IEC 27001 Information Security Management',
    description: 'International standard for information security management systems.',
    category: 'security',
    jurisdiction: ['Global'],
    enforcementBody: 'Accredited certification bodies',
    penalties: 'No direct penalties; affects business relationships and trust',
    keyRequirements: [
      'Information security policy',
      'Risk assessment and treatment',
      'Security controls implementation',
      'Continuous improvement',
      'Internal audits',
      'Management review'
    ],
    complianceIndicators: [
      'ISO 27001 certification',
      'Annual surveillance audits',
      'Statement of Applicability',
      'Risk treatment plan',
      'ISMS documentation'
    ]
  },
  lgpd: {
    id: 'lgpd',
    name: 'LGPD',
    fullName: 'Lei Geral de Proteção de Dados',
    description: 'Brazilian General Data Protection Law, similar to GDPR.',
    category: 'data-privacy',
    jurisdiction: ['Brazil'],
    enforcementBody: 'ANPD (National Data Protection Authority)',
    penalties: 'Up to 2% of revenue in Brazil, capped at R$50M per violation',
    keyRequirements: [
      'Legal basis for processing',
      'Data subject rights',
      'Privacy by design',
      'Data Protection Officer',
      'Breach notification',
      'International transfer rules'
    ],
    complianceIndicators: [
      'Portuguese privacy policy',
      'DPO appointment',
      'Consent mechanisms',
      'Data subject rights process',
      'Transfer mechanisms'
    ]
  },
  osha: {
    id: 'osha',
    name: 'OSHA',
    fullName: 'Occupational Safety and Health Administration',
    description: 'US agency regulations ensuring safe and healthful working conditions.',
    category: 'industry-specific',
    jurisdiction: ['US'],
    enforcementBody: 'OSHA',
    penalties: 'Up to $156,259 per willful violation',
    keyRequirements: [
      'Safe workplace provision',
      'Hazard communication',
      'PPE requirements',
      'Recordkeeping',
      'Employee training',
      'Injury reporting'
    ],
    complianceIndicators: [
      'Safety training records',
      'OSHA 300 log',
      'Safety policies',
      'Hazard assessments',
      'PPE program'
    ]
  }
};

// ================================================================
// INDUSTRY REGULATORY MAPPINGS
// ================================================================

export const INDUSTRY_REGULATIONS: Record<string, IndustryRegulatoryContext> = {
  saas: {
    industrySlug: 'saas',
    industryName: 'SaaS & Cloud Software',
    regulations: [
      { regulationId: 'soc2', complianceLevel: 'mandatory', notes: 'Essential for enterprise sales' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'Processing EU data' },
      { regulationId: 'ccpa', complianceLevel: 'mandatory', applicableWhen: 'California users' },
      { regulationId: 'iso-27001', complianceLevel: 'recommended', notes: 'Increasingly expected' },
      { regulationId: 'hipaa', complianceLevel: 'optional', applicableWhen: 'Healthcare customers' },
      { regulationId: 'pci-dss', complianceLevel: 'optional', applicableWhen: 'Processing payments' }
    ],
    complianceConsiderations: [
      'Data residency requirements by customer',
      'Subprocessor management and disclosure',
      'Data deletion and portability capabilities',
      'Security audit reports availability'
    ],
    promptContext: 'SaaS companies must demonstrate SOC 2 compliance for enterprise sales. GDPR applies for EU customers. Consider data residency requirements.'
  },
  fintech: {
    industrySlug: 'fintech',
    industryName: 'Fintech & Financial Services',
    regulations: [
      { regulationId: 'pci-dss', complianceLevel: 'mandatory', notes: 'Required for payment processing' },
      { regulationId: 'aml-kyc', complianceLevel: 'mandatory', notes: 'Core compliance requirement' },
      { regulationId: 'sox', complianceLevel: 'mandatory', applicableWhen: 'Public company' },
      { regulationId: 'finra', complianceLevel: 'mandatory', applicableWhen: 'Broker-dealer activities' },
      { regulationId: 'sec', complianceLevel: 'mandatory', applicableWhen: 'Securities activities' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU customers' },
      { regulationId: 'soc2', complianceLevel: 'mandatory' }
    ],
    complianceConsiderations: [
      'State money transmitter licenses',
      'Bank partnership compliance',
      'Transaction monitoring systems',
      'Customer fund protection (FDIC/SIPC)'
    ],
    promptContext: 'Fintech companies face strict regulatory requirements including PCI-DSS, AML/KYC, and often state-specific licenses. Trust and security are paramount.'
  },
  healthcare: {
    industrySlug: 'healthcare',
    industryName: 'Healthcare & Medical',
    regulations: [
      { regulationId: 'hipaa', complianceLevel: 'mandatory', notes: 'Core healthcare requirement' },
      { regulationId: 'fda', complianceLevel: 'mandatory', applicableWhen: 'Medical devices or drugs' },
      { regulationId: 'soc2', complianceLevel: 'recommended', notes: 'For health tech platforms' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU patients' }
    ],
    complianceConsiderations: [
      'Business Associate Agreements (BAAs)',
      'PHI handling and storage',
      'Breach notification procedures',
      'State health privacy laws'
    ],
    promptContext: 'Healthcare providers must be HIPAA compliant. Look for BAAs, security certifications, and documented PHI handling procedures.'
  },
  ecommerce: {
    industrySlug: 'ecommerce',
    industryName: 'E-commerce & Retail',
    regulations: [
      { regulationId: 'pci-dss', complianceLevel: 'mandatory', notes: 'Payment processing required' },
      { regulationId: 'ftc', complianceLevel: 'mandatory', notes: 'Consumer protection' },
      { regulationId: 'ccpa', complianceLevel: 'mandatory', applicableWhen: 'California customers' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU customers' },
      { regulationId: 'can-spam', complianceLevel: 'mandatory', applicableWhen: 'Email marketing' },
      { regulationId: 'ada', complianceLevel: 'recommended', notes: 'Website accessibility' }
    ],
    complianceConsiderations: [
      'Product safety requirements',
      'Return policy compliance',
      'Advertising truthfulness',
      'International shipping regulations'
    ],
    promptContext: 'E-commerce businesses must maintain PCI-DSS compliance and follow FTC consumer protection guidelines. Privacy laws apply based on customer locations.'
  },
  marketing: {
    industrySlug: 'marketing',
    industryName: 'Marketing & Advertising',
    regulations: [
      { regulationId: 'ftc', complianceLevel: 'mandatory', notes: 'Advertising guidelines' },
      { regulationId: 'can-spam', complianceLevel: 'mandatory', notes: 'Email marketing' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU data' },
      { regulationId: 'ccpa', complianceLevel: 'mandatory', applicableWhen: 'California data' },
      { regulationId: 'coppa', complianceLevel: 'mandatory', applicableWhen: 'Child-directed content' }
    ],
    complianceConsiderations: [
      'Influencer disclosure requirements',
      'Data broker registration',
      'Cookie consent requirements',
      'Third-party data usage'
    ],
    promptContext: 'Marketing companies must follow FTC endorsement guidelines and CAN-SPAM rules. Privacy regulations apply based on data handling practices.'
  },
  'real-estate': {
    industrySlug: 'real-estate',
    industryName: 'Real Estate',
    regulations: [
      { regulationId: 'fair-housing', complianceLevel: 'mandatory', notes: 'Core requirement' },
      { regulationId: 'ftc', complianceLevel: 'mandatory', notes: 'Consumer protection' },
      { regulationId: 'ada', complianceLevel: 'recommended', notes: 'Accessibility' }
    ],
    complianceConsiderations: [
      'State real estate licensing',
      'Fair lending requirements',
      'Advertising compliance',
      'Disclosure requirements'
    ],
    promptContext: 'Real estate professionals must comply with Fair Housing Act and state licensing requirements. Verify active licenses and good standing.'
  },
  legal: {
    industrySlug: 'legal',
    industryName: 'Legal Services',
    regulations: [
      { regulationId: 'state-bar', complianceLevel: 'mandatory', notes: 'Attorney licensing' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU clients' },
      { regulationId: 'soc2', complianceLevel: 'recommended', applicableWhen: 'Legal tech platforms' }
    ],
    complianceConsiderations: [
      'Attorney-client privilege',
      'Conflict of interest rules',
      'Trust account requirements',
      'Advertising restrictions'
    ],
    promptContext: 'Legal professionals must maintain active bar licenses and adhere to state ethics rules. Verify bar standing and disciplinary history.'
  },
  education: {
    industrySlug: 'education',
    industryName: 'Education & EdTech',
    regulations: [
      { regulationId: 'ferpa', complianceLevel: 'mandatory', notes: 'Student privacy' },
      { regulationId: 'coppa', complianceLevel: 'mandatory', applicableWhen: 'K-12 platforms' },
      { regulationId: 'ada', complianceLevel: 'mandatory', notes: 'Accessibility' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU students' }
    ],
    complianceConsiderations: [
      'Accreditation requirements',
      'Student data handling',
      'Accessibility standards',
      'Financial aid regulations'
    ],
    promptContext: 'Educational institutions must comply with FERPA for student records. EdTech platforms serving K-12 must meet COPPA requirements.'
  },
  hospitality: {
    industrySlug: 'hospitality',
    industryName: 'Hospitality & Travel',
    regulations: [
      { regulationId: 'ada', complianceLevel: 'mandatory', notes: 'Physical and digital accessibility' },
      { regulationId: 'ftc', complianceLevel: 'mandatory', notes: 'Consumer protection' },
      { regulationId: 'pci-dss', complianceLevel: 'mandatory', applicableWhen: 'Processing payments' },
      { regulationId: 'gdpr', complianceLevel: 'mandatory', applicableWhen: 'EU guests' },
      { regulationId: 'osha', complianceLevel: 'mandatory', notes: 'Workplace safety' }
    ],
    complianceConsiderations: [
      'Health and safety codes',
      'Liquor licensing',
      'Travel regulations',
      'Guest data protection'
    ],
    promptContext: 'Hospitality businesses must maintain ADA accessibility and follow health/safety codes. PCI-DSS applies for payment processing.'
  },
  restaurant: {
    industrySlug: 'restaurant',
    industryName: 'Restaurant & Food Service',
    regulations: [
      { regulationId: 'fda', complianceLevel: 'mandatory', notes: 'Food safety' },
      { regulationId: 'osha', complianceLevel: 'mandatory', notes: 'Workplace safety' },
      { regulationId: 'ada', complianceLevel: 'mandatory', notes: 'Accessibility' },
      { regulationId: 'ftc', complianceLevel: 'mandatory', notes: 'Advertising' },
      { regulationId: 'pci-dss', complianceLevel: 'mandatory', applicableWhen: 'Card payments' }
    ],
    complianceConsiderations: [
      'Health department inspections',
      'Food handling certifications',
      'Liquor licensing',
      'Allergen disclosure'
    ],
    promptContext: 'Restaurants must maintain health inspection compliance and food safety certifications. Check recent inspection scores when available.'
  }
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get regulation details by ID
 */
export function getRegulation(id: RegulationId): Regulation {
  return REGULATIONS[id];
}

/**
 * Get all regulations
 */
export function getAllRegulations(): Regulation[] {
  return Object.values(REGULATIONS);
}

/**
 * Get regulations by category
 */
export function getRegulationsByCategory(category: RegulationCategory): Regulation[] {
  return Object.values(REGULATIONS).filter(r => r.category === category);
}

/**
 * Get regulatory context for an industry
 */
export function getIndustryRegulations(industrySlug: string): IndustryRegulatoryContext | null {
  return INDUSTRY_REGULATIONS[industrySlug] || null;
}

/**
 * Get mandatory regulations for an industry
 */
export function getMandatoryRegulations(industrySlug: string): Regulation[] {
  const context = INDUSTRY_REGULATIONS[industrySlug];
  if (!context) return [];

  return context.regulations
    .filter(r => r.complianceLevel === 'mandatory')
    .map(r => REGULATIONS[r.regulationId]);
}

/**
 * Check if a regulation applies to an industry
 */
export function regulationApplies(
  industrySlug: string,
  regulationId: RegulationId
): boolean {
  const context = INDUSTRY_REGULATIONS[industrySlug];
  if (!context) return false;

  return context.regulations.some(r => r.regulationId === regulationId);
}

/**
 * Get compliance level for a regulation in an industry
 */
export function getComplianceLevel(
  industrySlug: string,
  regulationId: RegulationId
): ComplianceLevel | null {
  const context = INDUSTRY_REGULATIONS[industrySlug];
  if (!context) return null;

  const reg = context.regulations.find(r => r.regulationId === regulationId);
  return reg?.complianceLevel || null;
}

/**
 * Build regulatory context for prompts
 */
export function buildRegulatoryContext(industrySlug: string): string {
  const context = INDUSTRY_REGULATIONS[industrySlug];
  if (!context) {
    return '';
  }

  const lines = [`**Regulatory Context for ${context.industryName}:**`];
  lines.push('');

  const mandatory = context.regulations.filter(r => r.complianceLevel === 'mandatory');
  if (mandatory.length > 0) {
    lines.push('*Mandatory Compliance:*');
    mandatory.forEach(r => {
      const reg = REGULATIONS[r.regulationId];
      let line = `- ${reg.name}`;
      if (r.notes) line += ` (${r.notes})`;
      if (r.applicableWhen) line += ` - when ${r.applicableWhen}`;
      lines.push(line);
    });
  }

  lines.push('');
  lines.push(context.promptContext);

  return lines.join('\n');
}

/**
 * Get compliance indicators for a regulation
 */
export function getComplianceIndicators(regulationId: RegulationId): string[] {
  return REGULATIONS[regulationId]?.complianceIndicators || [];
}

/**
 * Get all supported industries with regulatory context
 */
export function getSupportedIndustries(): string[] {
  return Object.keys(INDUSTRY_REGULATIONS);
}

/**
 * Validate regulation ID
 */
export function isValidRegulation(id: string): id is RegulationId {
  return id in REGULATIONS;
}
