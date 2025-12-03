/**
 * Argumentation Mining Module
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Claim-premise-conclusion structure extraction
 * - Argument strength scoring
 * - Support/attack relationship detection
 * - Argumentation scheme classification
 */

// ============================================================================
// TYPES
// ============================================================================

export type ArgumentComponent = 'claim' | 'premise' | 'conclusion' | 'evidence' | 'rebuttal';

export type ArgumentRelation = 'support' | 'attack' | 'undercut' | 'rebuttal';

export type ArgumentScheme =
  | 'from_example'          // If X is true for case A, it may be true generally
  | 'from_analogy'          // X is like Y in relevant ways
  | 'from_authority'        // Expert says X, so X is credible
  | 'from_cause_to_effect'  // X causes Y, X occurred, so Y
  | 'from_sign'             // If X then usually Y; X, so probably Y
  | 'from_consequence'      // X leads to Y (good/bad), so do/don't do X
  | 'from_values'           // X promotes value V, V is good, so X is good
  | 'from_popular_opinion'  // Most people believe X, so X is reasonable
  | 'ad_hominem'            // Attack on person rather than argument
  | 'straw_man'             // Misrepresenting opponent's position
  | 'unknown';

export type ArgumentStrength = 'weak' | 'moderate' | 'strong' | 'very_strong';

export interface ArgumentUnit {
  id: string;
  type: ArgumentComponent;
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface ArgumentRelationship {
  sourceId: string;
  targetId: string;
  relation: ArgumentRelation;
  strength: number;  // 0-1
}

export interface ArgumentStructure {
  id: string;
  mainClaim: ArgumentUnit | null;
  premises: ArgumentUnit[];
  conclusions: ArgumentUnit[];
  evidence: ArgumentUnit[];
  rebuttals: ArgumentUnit[];
  relationships: ArgumentRelationship[];
  scheme: ArgumentScheme;
  overallStrength: ArgumentStrength;
  strengthScore: number;  // 0-100
}

export interface ArgumentationAnalysis {
  text: string;
  arguments: ArgumentStructure[];
  totalClaims: number;
  totalPremises: number;
  dominantScheme: ArgumentScheme;
  averageStrength: number;
  hasRebuttals: boolean;
  isWellSupported: boolean;
  metadata: {
    processedAt: Date;
    confidenceScore: number;
  };
}

// ============================================================================
// LINGUISTIC MARKERS
// ============================================================================

const CLAIM_MARKERS = [
  // Assertion markers
  'i believe', 'i think', 'in my opinion', 'it is clear that', 'we should',
  'the fact is', 'undoubtedly', 'certainly', 'obviously', 'it is evident',
  'the point is', 'my position is', 'i argue that', 'i contend that',
  'it must be acknowledged', 'it is important to note',
  // Evaluative markers
  'is the best', 'is superior', 'is preferable', 'outperforms', 'leads the market',
  'is recommended', 'is ideal for', 'is well-suited',
];

const PREMISE_MARKERS = [
  // Reason indicators
  'because', 'since', 'as', 'given that', 'considering that', 'due to',
  'for this reason', 'the reason is', 'this is because', 'owing to',
  // Evidence indicators
  'research shows', 'studies indicate', 'according to', 'data suggests',
  'evidence shows', 'statistics show', 'surveys reveal', 'experts say',
  // Support indicators
  'first', 'second', 'third', 'firstly', 'secondly', 'additionally',
  'moreover', 'furthermore', 'in addition', 'also', 'not only',
];

const CONCLUSION_MARKERS = [
  // Inference indicators
  'therefore', 'thus', 'hence', 'consequently', 'as a result',
  'it follows that', 'this means', 'this shows', 'this proves',
  'we can conclude', 'in conclusion', 'to conclude', 'finally',
  'this demonstrates', 'this indicates', 'this suggests',
  // Summary indicators
  'in summary', 'to sum up', 'overall', 'all things considered',
  'taking everything into account', 'on balance',
];

const REBUTTAL_MARKERS = [
  // Concession markers
  'however', 'but', 'although', 'though', 'even though', 'while',
  'despite', 'in spite of', 'nevertheless', 'nonetheless', 'yet',
  // Objection markers
  'on the other hand', 'some might argue', 'critics say', 'opponents claim',
  'one objection is', 'it could be argued', 'admittedly',
  // Limitation markers
  'the limitation is', 'a weakness is', 'the problem with this',
  'this fails to account for', 'this overlooks',
];

const EVIDENCE_MARKERS = [
  // Citation markers
  'according to', 'as stated by', 'research by', 'study by',
  'report from', 'data from', 'analysis by', 'survey conducted by',
  // Empirical markers
  'experiments show', 'trials demonstrate', 'results indicate',
  'findings reveal', 'observations suggest', 'measurements confirm',
  // Example markers
  'for example', 'for instance', 'such as', 'including',
  'to illustrate', 'consider the case of', 'take the example of',
];

// ============================================================================
// ARGUMENT SCHEME PATTERNS
// ============================================================================

const SCHEME_PATTERNS: Record<ArgumentScheme, RegExp[]> = {
  from_example: [
    /for example|for instance|such as|like|consider/i,
    /in the case of|take.*as an example/i,
  ],
  from_analogy: [
    /similar to|like|just as|in the same way|comparable to/i,
    /resembles|parallels|mirrors|akin to/i,
  ],
  from_authority: [
    /according to|experts say|research shows|studies indicate/i,
    /\bDr\.|\bProfessor|\bexpert|\bspecialist/i,
    /published in|journal|university|research/i,
  ],
  from_cause_to_effect: [
    /causes|leads to|results in|produces|creates/i,
    /because of this|as a result|consequently|therefore/i,
  ],
  from_sign: [
    /indicates|suggests|shows|signals|points to/i,
    /evidence of|sign of|symptom of|marker of/i,
  ],
  from_consequence: [
    /will lead to|would result in|consequences|implications/i,
    /if we.*then|should we.*would/i,
  ],
  from_values: [
    /values|principles|ethics|morally|rightfully/i,
    /important|essential|vital|crucial|fundamental/i,
  ],
  from_popular_opinion: [
    /most people|majority|widely believed|commonly accepted/i,
    /popular|mainstream|general consensus/i,
  ],
  ad_hominem: [
    /biased|incompetent|unqualified|has an agenda/i,
    /can't be trusted|not credible|self-interested/i,
  ],
  straw_man: [
    /they claim that|opponents say|critics argue.*but/i,
    /exaggerat|misrepresent|oversimplif/i,
  ],
  unknown: [],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Extract argument units from text
 */
export function extractArgumentUnits(text: string): ArgumentUnit[] {
  const units: ArgumentUnit[] = [];
  const sentences = splitIntoSentences(text);
  let globalIndex = 0;

  for (const sentence of sentences) {
    const sentenceStart = text.indexOf(sentence, globalIndex);
    const sentenceEnd = sentenceStart + sentence.length;

    // Classify the sentence
    const type = classifySentence(sentence);
    const confidence = calculateConfidence(sentence, type);

    if (type !== null && confidence > 0.3) {
      units.push({
        id: `arg_${units.length + 1}`,
        type,
        text: sentence.trim(),
        startIndex: sentenceStart,
        endIndex: sentenceEnd,
        confidence,
      });
    }

    globalIndex = sentenceEnd;
  }

  return units;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations
  const cleaned = text
    .replace(/Dr\./g, 'Dr')
    .replace(/Mr\./g, 'Mr')
    .replace(/Mrs\./g, 'Mrs')
    .replace(/Ms\./g, 'Ms')
    .replace(/Prof\./g, 'Prof')
    .replace(/e\.g\./gi, 'eg')
    .replace(/i\.e\./gi, 'ie');

  return cleaned
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}

/**
 * Classify a sentence as an argument component
 */
function classifySentence(sentence: string): ArgumentComponent | null {
  const lower = sentence.toLowerCase();

  // Check for rebuttal first (often contains other markers too)
  if (REBUTTAL_MARKERS.some(m => lower.includes(m))) {
    return 'rebuttal';
  }

  // Check for conclusion markers
  if (CONCLUSION_MARKERS.some(m => lower.includes(m))) {
    return 'conclusion';
  }

  // Check for evidence markers
  if (EVIDENCE_MARKERS.some(m => lower.includes(m))) {
    return 'evidence';
  }

  // Check for premise markers
  if (PREMISE_MARKERS.some(m => lower.includes(m))) {
    return 'premise';
  }

  // Check for claim markers
  if (CLAIM_MARKERS.some(m => lower.includes(m))) {
    return 'claim';
  }

  // Default: if it's an assertion, treat as potential claim
  if (isAssertiveSentence(sentence)) {
    return 'claim';
  }

  return null;
}

/**
 * Check if sentence is assertive (not question, not command)
 */
function isAssertiveSentence(sentence: string): boolean {
  const trimmed = sentence.trim();
  return (
    !trimmed.endsWith('?') &&
    !trimmed.startsWith('Please') &&
    !trimmed.startsWith('Do ') &&
    !trimmed.startsWith('Don\'t') &&
    trimmed.length > 20
  );
}

/**
 * Calculate confidence score for classification
 */
function calculateConfidence(sentence: string, type: ArgumentComponent | null): number {
  if (!type) return 0;

  const lower = sentence.toLowerCase();
  let score = 0.5;  // Base score

  // Get markers for this type
  const markers = getMarkersForType(type);
  const matchCount = markers.filter(m => lower.includes(m)).length;

  // More markers = higher confidence
  score += Math.min(matchCount * 0.15, 0.4);

  // Longer sentences with structure are more confident
  if (sentence.length > 50) score += 0.05;
  if (sentence.includes(',')) score += 0.05;

  return Math.min(score, 1);
}

/**
 * Get markers for argument type
 */
function getMarkersForType(type: ArgumentComponent): string[] {
  switch (type) {
    case 'claim': return CLAIM_MARKERS;
    case 'premise': return PREMISE_MARKERS;
    case 'conclusion': return CONCLUSION_MARKERS;
    case 'evidence': return EVIDENCE_MARKERS;
    case 'rebuttal': return REBUTTAL_MARKERS;
    default: return [];
  }
}

/**
 * Detect argument scheme
 */
export function detectArgumentScheme(text: string): ArgumentScheme {
  const lower = text.toLowerCase();

  for (const [scheme, patterns] of Object.entries(SCHEME_PATTERNS)) {
    if (patterns.some(p => p.test(lower))) {
      return scheme as ArgumentScheme;
    }
  }

  return 'unknown';
}

/**
 * Detect relationships between argument units
 */
export function detectRelationships(units: ArgumentUnit[]): ArgumentRelationship[] {
  const relationships: ArgumentRelationship[] = [];

  // Find the main claim (first claim or most confident)
  const claims = units.filter(u => u.type === 'claim');
  const mainClaim = claims.reduce<ArgumentUnit | null>(
    (best, current) => (!best || current.confidence > best.confidence) ? current : best,
    null
  );

  if (!mainClaim) return relationships;

  // Connect premises and evidence to claims
  for (const unit of units) {
    if (unit.type === 'premise' || unit.type === 'evidence') {
      relationships.push({
        sourceId: unit.id,
        targetId: mainClaim.id,
        relation: 'support',
        strength: unit.confidence,
      });
    }

    if (unit.type === 'rebuttal') {
      relationships.push({
        sourceId: unit.id,
        targetId: mainClaim.id,
        relation: 'attack',
        strength: unit.confidence,
      });
    }

    if (unit.type === 'conclusion' && unit.id !== mainClaim.id) {
      relationships.push({
        sourceId: mainClaim.id,
        targetId: unit.id,
        relation: 'support',
        strength: 0.8,
      });
    }
  }

  return relationships;
}

/**
 * Calculate argument strength
 */
export function calculateArgumentStrength(structure: Omit<ArgumentStructure, 'overallStrength' | 'strengthScore'>): {
  strength: ArgumentStrength;
  score: number;
} {
  let score = 50;  // Base score

  // Has a clear claim: +10
  if (structure.mainClaim) score += 10;

  // Number of premises: +5 each, max +20
  score += Math.min(structure.premises.length * 5, 20);

  // Has evidence: +15
  if (structure.evidence.length > 0) score += 15;

  // Multiple evidence sources: +5
  if (structure.evidence.length > 1) score += 5;

  // Has conclusion: +10
  if (structure.conclusions.length > 0) score += 10;

  // Addresses rebuttals (acknowledges counterarguments): +10
  if (structure.rebuttals.length > 0) score += 10;

  // Known scheme (not unknown): +5
  if (structure.scheme !== 'unknown') score += 5;

  // Penalty for fallacies
  if (structure.scheme === 'ad_hominem' || structure.scheme === 'straw_man') {
    score -= 20;
  }

  // Cap at 100
  score = Math.min(Math.max(score, 0), 100);

  // Convert to strength label
  let strength: ArgumentStrength;
  if (score >= 80) strength = 'very_strong';
  else if (score >= 60) strength = 'strong';
  else if (score >= 40) strength = 'moderate';
  else strength = 'weak';

  return { strength, score };
}

/**
 * Build argument structure from units
 */
export function buildArgumentStructure(units: ArgumentUnit[], text: string): ArgumentStructure {
  const claims = units.filter(u => u.type === 'claim');
  const premises = units.filter(u => u.type === 'premise');
  const conclusions = units.filter(u => u.type === 'conclusion');
  const evidence = units.filter(u => u.type === 'evidence');
  const rebuttals = units.filter(u => u.type === 'rebuttal');

  const mainClaim = claims.reduce<ArgumentUnit | null>(
    (best, current) => (!best || current.confidence > best.confidence) ? current : best,
    null
  );

  const relationships = detectRelationships(units);
  const scheme = detectArgumentScheme(text);

  const partialStructure = {
    id: `struct_${Date.now()}`,
    mainClaim,
    premises,
    conclusions,
    evidence,
    rebuttals,
    relationships,
    scheme,
  };

  const { strength, score } = calculateArgumentStrength(partialStructure);

  return {
    ...partialStructure,
    overallStrength: strength,
    strengthScore: score,
  };
}

/**
 * Analyze argumentation in text
 */
export function analyzeArgumentation(text: string): ArgumentationAnalysis {
  // Split into paragraphs for separate argument structures
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);

  const argStructures: ArgumentStructure[] = [];

  for (const paragraph of paragraphs) {
    const units = extractArgumentUnits(paragraph);
    if (units.length > 0) {
      argStructures.push(buildArgumentStructure(units, paragraph));
    }
  }

  // If no paragraphs, analyze entire text
  if (argStructures.length === 0 && text.length > 50) {
    const units = extractArgumentUnits(text);
    if (units.length > 0) {
      argStructures.push(buildArgumentStructure(units, text));
    }
  }

  // Calculate aggregates
  const totalClaims = argStructures.reduce((sum, a) => sum + (a.mainClaim ? 1 : 0), 0);
  const totalPremises = argStructures.reduce((sum, a) => sum + a.premises.length, 0);
  const hasRebuttals = argStructures.some(a => a.rebuttals.length > 0);

  // Dominant scheme
  const schemeCounts = new Map<ArgumentScheme, number>();
  for (const arg of argStructures) {
    schemeCounts.set(arg.scheme, (schemeCounts.get(arg.scheme) || 0) + 1);
  }
  const dominantScheme = Array.from(schemeCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Average strength
  const averageStrength = argStructures.length > 0
    ? argStructures.reduce((sum, a) => sum + a.strengthScore, 0) / argStructures.length
    : 0;

  // Is well supported if average strength > 60 and has premises
  const isWellSupported = averageStrength >= 60 && totalPremises > 0;

  // Overall confidence
  const allUnits = argStructures.flatMap(a => [
    a.mainClaim,
    ...a.premises,
    ...a.conclusions,
    ...a.evidence,
    ...a.rebuttals,
  ].filter(Boolean) as ArgumentUnit[]);

  const avgConfidence = allUnits.length > 0
    ? allUnits.reduce((sum, u) => sum + u.confidence, 0) / allUnits.length
    : 0;

  return {
    text,
    arguments: argStructures,
    totalClaims,
    totalPremises,
    dominantScheme,
    averageStrength,
    hasRebuttals,
    isWellSupported,
    metadata: {
      processedAt: new Date(),
      confidenceScore: avgConfidence,
    },
  };
}

/**
 * Extract claim-premise-conclusion triplets
 */
export function extractClaimPremiseConclusion(text: string): Array<{
  claim: string | null;
  premises: string[];
  conclusion: string | null;
}> {
  const analysis = analyzeArgumentation(text);

  return analysis.arguments.map(arg => ({
    claim: arg.mainClaim?.text || null,
    premises: arg.premises.map(p => p.text),
    conclusion: arg.conclusions[0]?.text || null,
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractArgumentUnits,
  detectArgumentScheme,
  detectRelationships,
  calculateArgumentStrength,
  buildArgumentStructure,
  analyzeArgumentation,
  extractClaimPremiseConclusion,
};
