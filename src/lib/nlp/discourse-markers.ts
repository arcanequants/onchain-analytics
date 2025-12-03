/**
 * Discourse Marker Classification
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Classify discourse markers by function
 * - Detect contrast, concession, cause, consequence
 * - Extract argumentation structure
 * - Identify claim-premise-conclusion patterns
 */

// ============================================================================
// TYPES
// ============================================================================

export type DiscourseFunction =
  | 'contrast'        // but, however, on the other hand
  | 'concession'      // although, despite, even though
  | 'cause'           // because, since, due to
  | 'consequence'     // therefore, thus, as a result
  | 'addition'        // moreover, furthermore, in addition
  | 'exemplification' // for example, such as, for instance
  | 'sequence'        // first, then, finally
  | 'emphasis'        // indeed, in fact, certainly
  | 'reformulation'   // in other words, that is, namely
  | 'summary'         // in summary, to conclude, overall
  | 'condition';      // if, unless, provided that

export type ArgumentRole = 'claim' | 'premise' | 'conclusion' | 'evidence' | 'rebuttal';

export interface DiscourseMarker {
  text: string;
  function: DiscourseFunction;
  position: 'initial' | 'medial' | 'final';
  startOffset: number;
  endOffset: number;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface ArgumentComponent {
  text: string;
  role: ArgumentRole;
  startOffset: number;
  endOffset: number;
  confidence: number;
  supportedBy?: number[]; // indices of supporting components
  attacks?: number[];     // indices of attacked components
}

export interface DiscourseAnalysis {
  markers: DiscourseMarker[];
  functionDistribution: Record<DiscourseFunction, number>;
  argumentStructure: ArgumentComponent[];
  coherenceScore: number; // 0-100
  argumentationStrength: number; // 0-100
}

// ============================================================================
// MARKER PATTERNS
// ============================================================================

interface MarkerDefinition {
  patterns: RegExp[];
  function: DiscourseFunction;
  strength: 'strong' | 'moderate' | 'weak';
}

const MARKER_DEFINITIONS: MarkerDefinition[] = [
  // Contrast
  {
    patterns: [
      /\bhowever\b/gi,
      /\bin contrast\b/gi,
      /\bon the other hand\b/gi,
      /\bconversely\b/gi,
      /\bnevertheless\b/gi,
      /\bnonetheless\b/gi,
    ],
    function: 'contrast',
    strength: 'strong',
  },
  {
    patterns: [/\bbut\b/gi, /\byet\b/gi, /\bstill\b/gi],
    function: 'contrast',
    strength: 'moderate',
  },
  {
    patterns: [/\bwhile\b/gi, /\bwhereas\b/gi],
    function: 'contrast',
    strength: 'weak',
  },

  // Concession
  {
    patterns: [
      /\balthough\b/gi,
      /\beven though\b/gi,
      /\bdespite\b/gi,
      /\bin spite of\b/gi,
      /\bnotwithstanding\b/gi,
    ],
    function: 'concession',
    strength: 'strong',
  },
  {
    patterns: [/\bthough\b/gi, /\beven if\b/gi],
    function: 'concession',
    strength: 'moderate',
  },
  {
    patterns: [/\bgranted\b/gi, /\badmittedly\b/gi],
    function: 'concession',
    strength: 'weak',
  },

  // Cause
  {
    patterns: [
      /\bbecause\b/gi,
      /\bsince\b/gi,
      /\bdue to\b/gi,
      /\bowing to\b/gi,
      /\bas a result of\b/gi,
    ],
    function: 'cause',
    strength: 'strong',
  },
  {
    patterns: [/\bfor\b/gi, /\bas\b/gi],
    function: 'cause',
    strength: 'weak',
  },

  // Consequence
  {
    patterns: [
      /\btherefore\b/gi,
      /\bthus\b/gi,
      /\bconsequently\b/gi,
      /\bas a result\b/gi,
      /\bhence\b/gi,
      /\baccordingly\b/gi,
    ],
    function: 'consequence',
    strength: 'strong',
  },
  {
    patterns: [/\bso\b/gi, /\bthen\b/gi],
    function: 'consequence',
    strength: 'weak',
  },

  // Addition
  {
    patterns: [
      /\bmoreover\b/gi,
      /\bfurthermore\b/gi,
      /\bin addition\b/gi,
      /\badditionally\b/gi,
      /\bbesides\b/gi,
    ],
    function: 'addition',
    strength: 'strong',
  },
  {
    patterns: [/\balso\b/gi, /\band\b/gi, /\bas well\b/gi],
    function: 'addition',
    strength: 'weak',
  },

  // Exemplification
  {
    patterns: [
      /\bfor example\b/gi,
      /\bfor instance\b/gi,
      /\bsuch as\b/gi,
      /\bnamely\b/gi,
      /\bto illustrate\b/gi,
    ],
    function: 'exemplification',
    strength: 'strong',
  },
  {
    patterns: [/\blike\b/gi, /\bincluding\b/gi],
    function: 'exemplification',
    strength: 'weak',
  },

  // Sequence
  {
    patterns: [
      /\bfirst(ly)?\b/gi,
      /\bsecond(ly)?\b/gi,
      /\bthird(ly)?\b/gi,
      /\bfinally\b/gi,
      /\blast(ly)?\b/gi,
      /\bin the first place\b/gi,
    ],
    function: 'sequence',
    strength: 'strong',
  },
  {
    patterns: [/\bthen\b/gi, /\bnext\b/gi, /\bafter\b/gi],
    function: 'sequence',
    strength: 'moderate',
  },

  // Emphasis
  {
    patterns: [
      /\bindeed\b/gi,
      /\bin fact\b/gi,
      /\bcertainly\b/gi,
      /\bundoubtedly\b/gi,
      /\bnotably\b/gi,
    ],
    function: 'emphasis',
    strength: 'strong',
  },
  {
    patterns: [/\breally\b/gi, /\bactually\b/gi],
    function: 'emphasis',
    strength: 'moderate',
  },

  // Reformulation
  {
    patterns: [
      /\bin other words\b/gi,
      /\bthat is\b/gi,
      /\bi\.e\./gi,
      /\bput differently\b/gi,
      /\bto put it another way\b/gi,
    ],
    function: 'reformulation',
    strength: 'strong',
  },
  {
    patterns: [/\bbasically\b/gi, /\bessentially\b/gi],
    function: 'reformulation',
    strength: 'weak',
  },

  // Summary
  {
    patterns: [
      /\bin summary\b/gi,
      /\bto summarize\b/gi,
      /\bto conclude\b/gi,
      /\bin conclusion\b/gi,
      /\boverall\b/gi,
      /\ball in all\b/gi,
    ],
    function: 'summary',
    strength: 'strong',
  },

  // Condition
  {
    patterns: [
      /\bif\b/gi,
      /\bunless\b/gi,
      /\bprovided that\b/gi,
      /\bas long as\b/gi,
      /\bin case\b/gi,
    ],
    function: 'condition',
    strength: 'strong',
  },
  {
    patterns: [/\bwhen\b/gi, /\bshould\b/gi],
    function: 'condition',
    strength: 'weak',
  },
];

// ============================================================================
// ARGUMENTATION PATTERNS
// ============================================================================

const CLAIM_INDICATORS = [
  /\bi believe\b/gi,
  /\bi think\b/gi,
  /\bi argue\b/gi,
  /\bit is clear that\b/gi,
  /\bthe evidence shows\b/gi,
  /\bthis demonstrates\b/gi,
  /\bthis proves\b/gi,
  /\bmy position is\b/gi,
  /\bthe main point is\b/gi,
];

const PREMISE_INDICATORS = [
  /\bbecause\b/gi,
  /\bsince\b/gi,
  /\bgiven that\b/gi,
  /\bthe reason is\b/gi,
  /\bthis is supported by\b/gi,
  /\bevidence suggests\b/gi,
  /\bstudies show\b/gi,
  /\bresearch indicates\b/gi,
];

const CONCLUSION_INDICATORS = [
  /\btherefore\b/gi,
  /\bthus\b/gi,
  /\bhence\b/gi,
  /\bconsequently\b/gi,
  /\bas a result\b/gi,
  /\bwe can conclude\b/gi,
  /\bit follows that\b/gi,
  /\bin conclusion\b/gi,
];

const REBUTTAL_INDICATORS = [
  /\bhowever\b/gi,
  /\bon the contrary\b/gi,
  /\bcritics argue\b/gi,
  /\bsome might object\b/gi,
  /\bopponents claim\b/gi,
  /\balternatively\b/gi,
];

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Determine marker position in sentence
 */
function getMarkerPosition(text: string, markerStart: number, markerEnd: number): 'initial' | 'medial' | 'final' {
  // Find sentence boundaries around the marker
  const beforeMarker = text.substring(0, markerStart);
  const afterMarker = text.substring(markerEnd);

  const sentenceStartMatch = beforeMarker.match(/[.!?]\s*$/);
  const sentenceEndMatch = afterMarker.match(/^[^.!?]*[.!?]/);

  const distanceFromStart = sentenceStartMatch
    ? markerStart - (beforeMarker.lastIndexOf(sentenceStartMatch[0]) + sentenceStartMatch[0].length)
    : markerStart;

  const distanceToEnd = sentenceEndMatch ? sentenceEndMatch[0].length : afterMarker.length;

  // If within first 20 chars of sentence start, it's initial
  if (distanceFromStart < 20) return 'initial';
  // If within last 20 chars before sentence end, it's final
  if (distanceToEnd < 20) return 'final';
  return 'medial';
}

/**
 * Extract discourse markers from text
 */
export function extractDiscourseMarkers(text: string): DiscourseMarker[] {
  const markers: DiscourseMarker[] = [];

  for (const definition of MARKER_DEFINITIONS) {
    for (const pattern of definition.patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        const position = getMarkerPosition(text, match.index, match.index + match[0].length);

        markers.push({
          text: match[0],
          function: definition.function,
          position,
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          strength: definition.strength,
        });
      }
    }
  }

  // Sort by offset and remove duplicates
  markers.sort((a, b) => a.startOffset - b.startOffset);

  // Remove overlapping markers
  const filtered: DiscourseMarker[] = [];
  for (const marker of markers) {
    const overlapping = filtered.find(
      m => (marker.startOffset >= m.startOffset && marker.startOffset < m.endOffset) ||
           (marker.endOffset > m.startOffset && marker.endOffset <= m.endOffset)
    );
    if (!overlapping) {
      filtered.push(marker);
    }
  }

  return filtered;
}

/**
 * Extract argumentation structure
 */
export function extractArgumentStructure(text: string): ArgumentComponent[] {
  const components: ArgumentComponent[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  sentences.forEach((sentence, idx) => {
    const trimmed = sentence.trim();
    const startOffset = text.indexOf(trimmed);
    const endOffset = startOffset + trimmed.length;

    let role: ArgumentRole | null = null;
    let confidence = 0;

    // Check for claim indicators
    for (const pattern of CLAIM_INDICATORS) {
      if (pattern.test(trimmed)) {
        role = 'claim';
        confidence = 0.8;
        break;
      }
    }

    // Check for premise indicators
    if (!role) {
      for (const pattern of PREMISE_INDICATORS) {
        if (pattern.test(trimmed)) {
          role = 'premise';
          confidence = 0.75;
          break;
        }
      }
    }

    // Check for conclusion indicators
    if (!role) {
      for (const pattern of CONCLUSION_INDICATORS) {
        if (pattern.test(trimmed)) {
          role = 'conclusion';
          confidence = 0.85;
          break;
        }
      }
    }

    // Check for rebuttal indicators
    if (!role) {
      for (const pattern of REBUTTAL_INDICATORS) {
        if (pattern.test(trimmed)) {
          role = 'rebuttal';
          confidence = 0.7;
          break;
        }
      }
    }

    // Default to evidence if contains factual statements
    if (!role) {
      const hasFactualIndicators = /\b(data|study|research|statistics|percent|according to)\b/i.test(trimmed);
      if (hasFactualIndicators) {
        role = 'evidence';
        confidence = 0.6;
      }
    }

    if (role) {
      components.push({
        text: trimmed,
        role,
        startOffset,
        endOffset,
        confidence,
      });
    }
  });

  // Establish support relationships
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];

    if (comp.role === 'premise' || comp.role === 'evidence') {
      // Look for claims or conclusions this might support
      const supportTargets = components
        .map((c, idx) => ({ comp: c, idx }))
        .filter(({ comp: c }) => c.role === 'claim' || c.role === 'conclusion')
        .filter(({ comp: c }) => Math.abs(c.startOffset - comp.startOffset) < 500)
        .map(({ idx }) => idx);

      if (supportTargets.length > 0) {
        comp.supportedBy = supportTargets;
      }
    }

    if (comp.role === 'rebuttal') {
      // Look for claims this might attack
      const attackTargets = components
        .map((c, idx) => ({ comp: c, idx }))
        .filter(({ comp: c }) => c.role === 'claim')
        .filter(({ comp: c }) => Math.abs(c.startOffset - comp.startOffset) < 500)
        .map(({ idx }) => idx);

      if (attackTargets.length > 0) {
        comp.attacks = attackTargets;
      }
    }
  }

  return components;
}

/**
 * Calculate coherence score based on discourse markers
 */
function calculateCoherenceScore(markers: DiscourseMarker[], textLength: number): number {
  if (textLength === 0) return 0;

  // Factors for coherence:
  // 1. Variety of discourse functions
  // 2. Appropriate density of markers
  // 3. Strength of markers used

  const functions = new Set(markers.map(m => m.function));
  const varietyScore = Math.min(functions.size * 10, 40);

  const wordCount = textLength / 5; // Approximate
  const density = markers.length / wordCount;
  const idealDensity = 0.03; // ~3 markers per 100 words
  const densityScore = Math.max(0, 30 - Math.abs(density - idealDensity) * 500);

  const strongMarkers = markers.filter(m => m.strength === 'strong').length;
  const strengthScore = Math.min(strongMarkers * 5, 30);

  return Math.round(varietyScore + densityScore + strengthScore);
}

/**
 * Calculate argumentation strength
 */
function calculateArgumentationStrength(components: ArgumentComponent[]): number {
  if (components.length === 0) return 0;

  // Factors:
  // 1. Presence of claims
  // 2. Evidence/premises supporting claims
  // 3. Conclusions drawn
  // 4. Handling of rebuttals

  const claims = components.filter(c => c.role === 'claim').length;
  const premises = components.filter(c => c.role === 'premise').length;
  const evidence = components.filter(c => c.role === 'evidence').length;
  const conclusions = components.filter(c => c.role === 'conclusion').length;
  const rebuttals = components.filter(c => c.role === 'rebuttal').length;

  let score = 0;

  // Claims present
  if (claims > 0) score += 20;

  // Support for claims
  if (premises > 0 || evidence > 0) score += 25;

  // Evidence quality
  score += Math.min(evidence * 5, 20);

  // Conclusions drawn
  if (conclusions > 0) score += 15;

  // Addresses counterarguments
  if (rebuttals > 0) score += 10;

  // Support relationships established
  const withSupport = components.filter(c => c.supportedBy && c.supportedBy.length > 0).length;
  score += Math.min(withSupport * 5, 10);

  return Math.min(score, 100);
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Perform complete discourse analysis
 */
export function analyzeDiscourse(text: string): DiscourseAnalysis {
  const markers = extractDiscourseMarkers(text);
  const argumentStructure = extractArgumentStructure(text);

  // Calculate function distribution
  const functionDistribution: Record<DiscourseFunction, number> = {
    contrast: 0,
    concession: 0,
    cause: 0,
    consequence: 0,
    addition: 0,
    exemplification: 0,
    sequence: 0,
    emphasis: 0,
    reformulation: 0,
    summary: 0,
    condition: 0,
  };

  for (const marker of markers) {
    functionDistribution[marker.function]++;
  }

  const coherenceScore = calculateCoherenceScore(markers, text.length);
  const argumentationStrength = calculateArgumentationStrength(argumentStructure);

  return {
    markers,
    functionDistribution,
    argumentStructure,
    coherenceScore,
    argumentationStrength,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractDiscourseMarkers,
  extractArgumentStructure,
  analyzeDiscourse,
};
