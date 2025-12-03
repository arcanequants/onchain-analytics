/**
 * E-E-A-T Scoring Module
 *
 * Phase 2, Week 3, Day 3
 *
 * Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness
 * signals from websites for AI perception optimization.
 *
 * Based on Google's Search Quality Evaluator Guidelines
 */

// ================================================================
// TYPES
// ================================================================

/**
 * E-E-A-T dimension
 */
export type EEATDimension = 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';

/**
 * Signal strength
 */
export type SignalStrength = 'strong' | 'moderate' | 'weak' | 'absent';

/**
 * Individual E-E-A-T signal
 */
export interface EEATSignal {
  dimension: EEATDimension;
  name: string;
  description: string;
  present: boolean;
  strength: SignalStrength;
  evidence?: string;
  weight: number;
}

/**
 * Dimension score
 */
export interface DimensionScore {
  dimension: EEATDimension;
  displayName: string;
  score: number;
  maxScore: number;
  signals: EEATSignal[];
  recommendations: string[];
}

/**
 * Complete E-E-A-T assessment
 */
export interface EEATAssessment {
  /** Overall E-E-A-T score (0-100) */
  overallScore: number;
  /** Overall rating */
  rating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  /** Individual dimension scores */
  dimensions: DimensionScore[];
  /** Top recommendations */
  recommendations: EEATRecommendation[];
  /** Summary for AI perception */
  summary: string;
  /** Assessment timestamp */
  assessedAt: string;
}

/**
 * E-E-A-T recommendation
 */
export interface EEATRecommendation {
  dimension: EEATDimension;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

/**
 * Input data for E-E-A-T assessment
 */
export interface EEATInput {
  /** Website URL */
  url: string;
  /** Page content text */
  content: string;
  /** Page title */
  title?: string;
  /** Author information (if available) */
  author?: AuthorInfo;
  /** Organization info (if available) */
  organization?: OrganizationInfo;
  /** Structured data found */
  structuredData?: Record<string, unknown>[];
  /** Social links found */
  socialLinks?: string[];
  /** Reviews/testimonials found */
  hasReviews?: boolean;
  /** Contact information found */
  hasContactInfo?: boolean;
  /** Privacy policy found */
  hasPrivacyPolicy?: boolean;
  /** Terms of service found */
  hasTermsOfService?: boolean;
  /** SSL enabled */
  hasSSL?: boolean;
  /** About page exists */
  hasAboutPage?: boolean;
  /** External citations/references */
  citations?: string[];
}

export interface AuthorInfo {
  name?: string;
  bio?: string;
  credentials?: string[];
  socialProfiles?: string[];
  profileUrl?: string;
}

export interface OrganizationInfo {
  name?: string;
  description?: string;
  foundedYear?: number;
  industry?: string;
  certifications?: string[];
  awards?: string[];
  partnerships?: string[];
}

// ================================================================
// SIGNAL DEFINITIONS
// ================================================================

const EXPERIENCE_SIGNALS: Array<{
  name: string;
  description: string;
  detect: (input: EEATInput) => { present: boolean; strength: SignalStrength; evidence?: string };
  weight: number;
}> = [
  {
    name: 'First-hand experience language',
    description: 'Content shows direct personal experience',
    detect: (input) => {
      const experiencePatterns = [
        /\b(i|we) (have|had) (used|tried|tested|experienced)\b/i,
        /\bin my experience\b/i,
        /\bover (the )?(\d+) years of\b/i,
        /\bworking with\b.*\bfor (\d+) years\b/i,
        /\bfirsthand\b/i,
        /\bpersonally\b/i,
      ];
      const matches = experiencePatterns.filter(p => p.test(input.content));
      return {
        present: matches.length > 0,
        strength: matches.length >= 3 ? 'strong' : matches.length >= 1 ? 'moderate' : 'absent',
        evidence: matches.length > 0 ? 'Experience-indicating language found' : undefined,
      };
    },
    weight: 15,
  },
  {
    name: 'Case studies or examples',
    description: 'Includes real-world examples or case studies',
    detect: (input) => {
      const caseStudyPatterns = [
        /\bcase study\b/i,
        /\breal(-| )world example\b/i,
        /\bfor example\b/i,
        /\bsuccess stor(y|ies)\b/i,
        /\bclient testimon\b/i,
      ];
      const matches = caseStudyPatterns.filter(p => p.test(input.content));
      return {
        present: matches.length > 0,
        strength: matches.length >= 2 ? 'strong' : matches.length >= 1 ? 'moderate' : 'absent',
      };
    },
    weight: 10,
  },
  {
    name: 'Specific details and metrics',
    description: 'Contains specific numbers, dates, or measurable outcomes',
    detect: (input) => {
      const metricPatterns = [
        /\b\d+%\b/,
        /\b\$[\d,]+\b/,
        /\bincreased by\b.*\d+/i,
        /\breduced\b.*\d+/i,
        /\bsaved\b.*\d+/i,
        /\b\d+ (days|weeks|months|years)\b/i,
      ];
      const matches = metricPatterns.filter(p => p.test(input.content));
      return {
        present: matches.length > 0,
        strength: matches.length >= 5 ? 'strong' : matches.length >= 2 ? 'moderate' : 'weak',
      };
    },
    weight: 10,
  },
];

const EXPERTISE_SIGNALS: Array<{
  name: string;
  description: string;
  detect: (input: EEATInput) => { present: boolean; strength: SignalStrength; evidence?: string };
  weight: number;
}> = [
  {
    name: 'Author credentials',
    description: 'Author has verifiable credentials or qualifications',
    detect: (input) => {
      const hasCredentials = input.author?.credentials && input.author.credentials.length > 0;
      const hasBio = input.author?.bio && input.author.bio.length > 50;
      return {
        present: hasCredentials || hasBio || false,
        strength: hasCredentials ? 'strong' : hasBio ? 'moderate' : 'absent',
        evidence: hasCredentials ? `Credentials: ${input.author?.credentials?.join(', ')}` : undefined,
      };
    },
    weight: 20,
  },
  {
    name: 'Technical depth',
    description: 'Content demonstrates technical knowledge',
    detect: (input) => {
      // Count technical terms (simplified heuristic)
      const technicalPatterns = [
        /\balgorithm\b/i,
        /\bimplementation\b/i,
        /\barchitecture\b/i,
        /\bmethodolog(y|ies)\b/i,
        /\bframework\b/i,
        /\bstrateg(y|ies)\b/i,
        /\banalysis\b/i,
        /\boptimiz\b/i,
      ];
      const matches = technicalPatterns.filter(p => p.test(input.content));
      return {
        present: matches.length > 0,
        strength: matches.length >= 5 ? 'strong' : matches.length >= 2 ? 'moderate' : 'weak',
      };
    },
    weight: 15,
  },
  {
    name: 'Citations and references',
    description: 'Content cites authoritative sources',
    detect: (input) => {
      const hasCitations = input.citations && input.citations.length > 0;
      const citationPatterns = [
        /\baccording to\b/i,
        /\bresearch shows\b/i,
        /\bstudies indicate\b/i,
        /\bsource:\b/i,
        /\breference:\b/i,
      ];
      const textCitations = citationPatterns.filter(p => p.test(input.content));
      const totalCitations = (input.citations?.length || 0) + textCitations.length;
      return {
        present: totalCitations > 0,
        strength: totalCitations >= 5 ? 'strong' : totalCitations >= 2 ? 'moderate' : 'weak',
      };
    },
    weight: 15,
  },
  {
    name: 'Industry certifications',
    description: 'Organization has industry certifications',
    detect: (input) => {
      const hasCerts = input.organization?.certifications && input.organization.certifications.length > 0;
      return {
        present: hasCerts || false,
        strength: hasCerts ? 'strong' : 'absent',
        evidence: hasCerts ? `Certifications: ${input.organization?.certifications?.join(', ')}` : undefined,
      };
    },
    weight: 10,
  },
];

const AUTHORITATIVENESS_SIGNALS: Array<{
  name: string;
  description: string;
  detect: (input: EEATInput) => { present: boolean; strength: SignalStrength; evidence?: string };
  weight: number;
}> = [
  {
    name: 'Industry recognition',
    description: 'Organization has awards or recognition',
    detect: (input) => {
      const hasAwards = input.organization?.awards && input.organization.awards.length > 0;
      const awardPatterns = [/\baward\b/i, /\brecognition\b/i, /\bhonor\b/i, /\bwinner\b/i];
      const textAwards = awardPatterns.filter(p => p.test(input.content));
      return {
        present: hasAwards || textAwards.length > 0,
        strength: hasAwards ? 'strong' : textAwards.length >= 2 ? 'moderate' : 'weak',
        evidence: hasAwards ? `Awards: ${input.organization?.awards?.join(', ')}` : undefined,
      };
    },
    weight: 15,
  },
  {
    name: 'Partnerships',
    description: 'Has notable partnerships or affiliations',
    detect: (input) => {
      const hasPartnerships = input.organization?.partnerships && input.organization.partnerships.length > 0;
      const partnerPatterns = [/\bpartner(ship)?\b/i, /\baffiliation\b/i, /\bcollaboration\b/i];
      const textPartners = partnerPatterns.filter(p => p.test(input.content));
      return {
        present: hasPartnerships || textPartners.length > 0,
        strength: hasPartnerships ? 'strong' : textPartners.length > 0 ? 'moderate' : 'absent',
      };
    },
    weight: 10,
  },
  {
    name: 'Social media presence',
    description: 'Active social media profiles linked',
    detect: (input) => {
      const socialCount = input.socialLinks?.length || 0;
      const authorSocial = input.author?.socialProfiles?.length || 0;
      const total = socialCount + authorSocial;
      return {
        present: total > 0,
        strength: total >= 4 ? 'strong' : total >= 2 ? 'moderate' : 'weak',
        evidence: total > 0 ? `${total} social profiles linked` : undefined,
      };
    },
    weight: 10,
  },
  {
    name: 'About page',
    description: 'Comprehensive about page exists',
    detect: (input) => {
      return {
        present: input.hasAboutPage || false,
        strength: input.hasAboutPage ? 'moderate' : 'absent',
      };
    },
    weight: 10,
  },
  {
    name: 'Established presence',
    description: 'Organization has been operating for significant time',
    detect: (input) => {
      const foundedYear = input.organization?.foundedYear;
      if (!foundedYear) return { present: false, strength: 'absent' as SignalStrength };

      const yearsActive = new Date().getFullYear() - foundedYear;
      return {
        present: yearsActive > 0,
        strength: yearsActive >= 10 ? 'strong' : yearsActive >= 5 ? 'moderate' : 'weak',
        evidence: `Founded ${foundedYear} (${yearsActive} years)`,
      };
    },
    weight: 10,
  },
];

const TRUSTWORTHINESS_SIGNALS: Array<{
  name: string;
  description: string;
  detect: (input: EEATInput) => { present: boolean; strength: SignalStrength; evidence?: string };
  weight: number;
}> = [
  {
    name: 'SSL/HTTPS',
    description: 'Website uses secure HTTPS connection',
    detect: (input) => {
      const hasSSL = input.hasSSL || input.url.startsWith('https://');
      return {
        present: hasSSL,
        strength: hasSSL ? 'strong' : 'absent',
      };
    },
    weight: 15,
  },
  {
    name: 'Privacy policy',
    description: 'Privacy policy is available',
    detect: (input) => {
      return {
        present: input.hasPrivacyPolicy || false,
        strength: input.hasPrivacyPolicy ? 'strong' : 'absent',
      };
    },
    weight: 10,
  },
  {
    name: 'Terms of service',
    description: 'Terms of service are available',
    detect: (input) => {
      return {
        present: input.hasTermsOfService || false,
        strength: input.hasTermsOfService ? 'moderate' : 'absent',
      };
    },
    weight: 5,
  },
  {
    name: 'Contact information',
    description: 'Clear contact information provided',
    detect: (input) => {
      return {
        present: input.hasContactInfo || false,
        strength: input.hasContactInfo ? 'strong' : 'absent',
      };
    },
    weight: 15,
  },
  {
    name: 'Reviews and testimonials',
    description: 'Customer reviews or testimonials present',
    detect: (input) => {
      return {
        present: input.hasReviews || false,
        strength: input.hasReviews ? 'strong' : 'absent',
      };
    },
    weight: 10,
  },
  {
    name: 'Structured data',
    description: 'Schema.org structured data implemented',
    detect: (input) => {
      const hasStructured = input.structuredData && input.structuredData.length > 0;
      return {
        present: hasStructured || false,
        strength: hasStructured ? 'strong' : 'absent',
        evidence: hasStructured ? `${input.structuredData?.length} schema(s) found` : undefined,
      };
    },
    weight: 10,
  },
];

// ================================================================
// ASSESSMENT FUNCTIONS
// ================================================================

/**
 * Assess E-E-A-T signals from input data
 */
export function assessEEAT(input: EEATInput): EEATAssessment {
  const dimensions: DimensionScore[] = [];

  // Assess each dimension
  dimensions.push(assessDimension('experience', 'Experience', EXPERIENCE_SIGNALS, input));
  dimensions.push(assessDimension('expertise', 'Expertise', EXPERTISE_SIGNALS, input));
  dimensions.push(assessDimension('authoritativeness', 'Authoritativeness', AUTHORITATIVENESS_SIGNALS, input));
  dimensions.push(assessDimension('trustworthiness', 'Trustworthiness', TRUSTWORTHINESS_SIGNALS, input));

  // Calculate overall score
  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const maxPossible = dimensions.reduce((sum, d) => sum + d.maxScore, 0);
  const overallScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

  // Determine rating
  const rating = getOverallRating(overallScore);

  // Generate recommendations
  const recommendations = generateRecommendations(dimensions);

  // Generate summary
  const summary = generateSummary(dimensions, overallScore, rating);

  return {
    overallScore,
    rating,
    dimensions,
    recommendations,
    summary,
    assessedAt: new Date().toISOString(),
  };
}

function assessDimension(
  dimension: EEATDimension,
  displayName: string,
  signalDefs: typeof EXPERIENCE_SIGNALS,
  input: EEATInput
): DimensionScore {
  const signals: EEATSignal[] = [];
  let score = 0;
  let maxScore = 0;

  for (const signalDef of signalDefs) {
    const result = signalDef.detect(input);

    const signal: EEATSignal = {
      dimension,
      name: signalDef.name,
      description: signalDef.description,
      present: result.present,
      strength: result.strength,
      evidence: result.evidence,
      weight: signalDef.weight,
    };

    signals.push(signal);
    maxScore += signalDef.weight;

    if (result.present) {
      switch (result.strength) {
        case 'strong':
          score += signalDef.weight;
          break;
        case 'moderate':
          score += signalDef.weight * 0.6;
          break;
        case 'weak':
          score += signalDef.weight * 0.3;
          break;
      }
    }
  }

  // Generate dimension-specific recommendations
  const recommendations = signals
    .filter(s => !s.present || s.strength === 'weak')
    .map(s => `Improve ${s.name.toLowerCase()}: ${s.description}`);

  return {
    dimension,
    displayName,
    score: Math.round(score),
    maxScore,
    signals,
    recommendations: recommendations.slice(0, 3),
  };
}

function getOverallRating(score: number): EEATAssessment['rating'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs-improvement';
  return 'poor';
}

function generateRecommendations(dimensions: DimensionScore[]): EEATRecommendation[] {
  const recommendations: EEATRecommendation[] = [];

  for (const dimension of dimensions) {
    const weakSignals = dimension.signals.filter(s => !s.present || s.strength === 'weak' || s.strength === 'absent');

    for (const signal of weakSignals.slice(0, 2)) {
      const priority = signal.weight >= 15 ? 'high' : signal.weight >= 10 ? 'medium' : 'low';

      recommendations.push({
        dimension: dimension.dimension,
        priority,
        title: `Improve ${signal.name}`,
        description: signal.description,
        impact: `+${signal.weight} potential points in ${dimension.displayName}`,
      });
    }
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 10);
}

function generateSummary(
  dimensions: DimensionScore[],
  overallScore: number,
  rating: EEATAssessment['rating']
): string {
  const ratingText: Record<typeof rating, string> = {
    excellent: 'demonstrates excellent E-E-A-T signals',
    good: 'shows good E-E-A-T signals with room for improvement',
    'needs-improvement': 'has notable E-E-A-T gaps that should be addressed',
    poor: 'needs significant E-E-A-T improvements',
  };

  const strongestDimension = dimensions.reduce((best, d) =>
    (d.score / d.maxScore) > (best.score / best.maxScore) ? d : best
  );

  const weakestDimension = dimensions.reduce((worst, d) =>
    (d.score / d.maxScore) < (worst.score / worst.maxScore) ? d : worst
  );

  return `E-E-A-T Score: ${overallScore}/100. This content ${ratingText[rating]}. ` +
    `Strongest area: ${strongestDimension.displayName}. ` +
    `Priority improvement: ${weakestDimension.displayName}.`;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Quick E-E-A-T score from basic inputs
 */
export function quickEEATScore(content: string, url: string): number {
  const input: EEATInput = {
    url,
    content,
    hasSSL: url.startsWith('https://'),
  };

  return assessEEAT(input).overallScore;
}

/**
 * Get dimension score by name
 */
export function getDimensionScore(assessment: EEATAssessment, dimension: EEATDimension): DimensionScore | undefined {
  return assessment.dimensions.find(d => d.dimension === dimension);
}

/**
 * Get all weak signals across dimensions
 */
export function getWeakSignals(assessment: EEATAssessment): EEATSignal[] {
  return assessment.dimensions.flatMap(d =>
    d.signals.filter(s => !s.present || s.strength === 'weak' || s.strength === 'absent')
  );
}

/**
 * Get dimension display name
 */
export function getDimensionDisplayName(dimension: EEATDimension): string {
  const names: Record<EEATDimension, string> = {
    experience: 'Experience',
    expertise: 'Expertise',
    authoritativeness: 'Authoritativeness',
    trustworthiness: 'Trustworthiness',
  };
  return names[dimension];
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  assessEEAT,
  quickEEATScore,
  getDimensionScore,
  getWeakSignals,
  getDimensionDisplayName,
};
