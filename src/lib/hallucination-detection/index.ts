/**
 * Hallucination Detection System
 *
 * Phase 2, Week 3, Day 2
 * Compares AI claims against scraped website data to detect hallucinations.
 *
 * Features:
 * - Extract claims from AI responses
 * - Verify claims against website content
 * - Calculate hallucination score
 * - Flag specific unverified claims
 * - Track verification confidence
 */

// ================================================================
// TYPES
// ================================================================

/**
 * Types of claims that can be made by AI
 */
export type ClaimType =
  | 'factual'      // Verifiable facts (e.g., "founded in 2010")
  | 'product'      // Product/service claims (e.g., "offers cloud storage")
  | 'location'     // Geographic claims (e.g., "headquartered in NYC")
  | 'contact'      // Contact information (e.g., "email is...")
  | 'pricing'      // Pricing claims (e.g., "starts at $9.99")
  | 'comparison'   // Comparative claims (e.g., "faster than competitor")
  | 'statistic'    // Statistical claims (e.g., "10 million users")
  | 'feature'      // Feature claims (e.g., "supports dark mode")
  | 'temporal'     // Time-based claims (e.g., "launched last year")
  | 'attribution'; // Source attribution (e.g., "according to...")

/**
 * Verification status for a claim
 */
export type VerificationStatus =
  | 'verified'        // Claim matches website data
  | 'unverified'      // Could not verify (no evidence either way)
  | 'contradicted'    // Website contains contradicting information
  | 'partial'         // Partially verified
  | 'not_applicable'; // Claim cannot be verified from website

/**
 * Extracted claim from AI response
 */
export interface ExtractedClaim {
  /** The claim text */
  text: string;
  /** Type of claim */
  type: ClaimType;
  /** Confidence of extraction (0-1) */
  extractionConfidence: number;
  /** Start index in original text */
  startIndex: number;
  /** End index in original text */
  endIndex: number;
  /** Entities mentioned in the claim */
  entities: string[];
}

/**
 * Verification result for a claim
 */
export interface ClaimVerification {
  /** The original claim */
  claim: ExtractedClaim;
  /** Verification status */
  status: VerificationStatus;
  /** Confidence in verification (0-1) */
  confidence: number;
  /** Evidence from website (if found) */
  evidence?: string;
  /** Source URL or section of the evidence */
  evidenceSource?: string;
  /** Reason for status */
  reason: string;
}

/**
 * Website data for verification
 */
export interface WebsiteData {
  /** Main page content */
  content: string;
  /** Page title */
  title: string;
  /** Meta description */
  metaDescription?: string;
  /** Structured data (JSON-LD) */
  structuredData?: Record<string, unknown>[];
  /** About page content (if available) */
  aboutContent?: string;
  /** Contact information */
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  /** Pricing information (if found) */
  pricing?: string[];
  /** Product/service names */
  products?: string[];
  /** Company founding date/year */
  foundedYear?: number;
  /** Headquarters location */
  headquarters?: string;
}

/**
 * Full hallucination detection result
 */
export interface HallucinationReport {
  /** Overall hallucination score (0-1, higher = more hallucination) */
  score: number;
  /** Total claims extracted */
  totalClaims: number;
  /** Number of verified claims */
  verifiedClaims: number;
  /** Number of contradicted claims */
  contradictedClaims: number;
  /** Number of unverified claims */
  unverifiedClaims: number;
  /** Individual claim verifications */
  verifications: ClaimVerification[];
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Summary of findings */
  summary: string;
  /** Timestamp of analysis */
  analyzedAt: string;
}

// ================================================================
// CLAIM EXTRACTION
// ================================================================

/**
 * Patterns for extracting different types of claims
 */
const CLAIM_PATTERNS: Record<ClaimType, RegExp[]> = {
  factual: [
    /(?:is|are|was|were)\s+(?:a|an|the)\s+[^.]+/gi,
    /(?:founded|established|started|created)\s+(?:in|by)\s+[^.]+/gi,
    /(?:known\s+for|famous\s+for|specializes?\s+in)\s+[^.]+/gi,
  ],
  product: [
    /(?:offers?|provides?|sells?|delivers?)\s+[^.]+/gi,
    /(?:product|service|solution|platform)\s+(?:called|named|known\s+as)\s+[^.]+/gi,
    /(?:their|its)\s+(?:main|primary|core)\s+(?:product|service|offering)\s+[^.]+/gi,
  ],
  location: [
    /(?:headquartered|based|located)\s+(?:in|at)\s+[^.]+/gi,
    /(?:operates?\s+in|serves?)\s+(?:\d+\s+)?(?:countries|regions|markets)[^.]+/gi,
    /(?:offices?\s+in|branches?\s+in)\s+[^.]+/gi,
  ],
  contact: [
    /(?:email|phone|contact|reach\s+them?\s+at)\s*[:\s]+[^.]+/gi,
    /(?:website|url|site)\s*[:\s]+[^.]+/gi,
    /(?:social\s+media|twitter|facebook|linkedin|instagram)\s*[:\s]+[^.]+/gi,
  ],
  pricing: [
    /(?:starts?\s+at|costs?|priced?\s+at|from)\s*\$[\d,]+[^.]+/gi,
    /(?:free|freemium|subscription|monthly|annual)\s+(?:plan|tier|pricing)[^.]+/gi,
    /\$[\d,]+\s*(?:per|\/)\s*(?:month|year|user)[^.]+/gi,
  ],
  comparison: [
    /(?:better|worse|faster|slower|cheaper|more\s+expensive)\s+than\s+[^.]+/gi,
    /(?:compared\s+to|unlike|similar\s+to|different\s+from)\s+[^.]+/gi,
    /(?:the\s+(?:best|worst|leading|top)\s+)[^.]+/gi,
  ],
  statistic: [
    /(?:\d+(?:,\d+)*(?:\.\d+)?)\s*(?:%|percent|million|billion|thousand|users?|customers?|clients?)[^.]+/gi,
    /(?:over|more\s+than|approximately|around|about)\s+\d+[^.]+/gi,
    /(?:ranked|rated)\s+#?\d+[^.]+/gi,
  ],
  feature: [
    /(?:supports?|includes?|features?|enables?|allows?)\s+[^.]+/gi,
    /(?:has|have|with)\s+(?:built-in|integrated|native)\s+[^.]+/gi,
    /(?:can|able\s+to|capable\s+of)\s+[^.]+/gi,
  ],
  temporal: [
    /(?:in|since|as\s+of)\s+(?:20\d{2}|19\d{2})[^.]+/gi,
    /(?:last|this|next)\s+(?:year|month|week|quarter)[^.]+/gi,
    /(?:recently|currently|now|today)[^.]+/gi,
  ],
  attribution: [
    /(?:according\s+to|as\s+(?:stated|reported|mentioned)\s+by)\s+[^.]+/gi,
    /(?:source|citation)[:\s]+[^.]+/gi,
    /(?:per|via)\s+[^.]+/gi,
  ],
};

/**
 * Extract claims from AI response text
 */
export function extractClaims(text: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const seenTexts = new Set<string>();

  for (const [type, patterns] of Object.entries(CLAIM_PATTERNS) as [ClaimType, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);

      for (const match of matches) {
        const claimText = match[0].trim();

        // Skip very short or duplicate claims
        if (claimText.length < 10 || seenTexts.has(claimText.toLowerCase())) {
          continue;
        }

        seenTexts.add(claimText.toLowerCase());

        claims.push({
          text: claimText,
          type,
          extractionConfidence: calculateExtractionConfidence(claimText, type),
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + claimText.length,
          entities: extractEntities(claimText),
        });
      }
    }
  }

  // Sort by position in text
  return claims.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Calculate extraction confidence based on claim characteristics
 */
function calculateExtractionConfidence(text: string, type: ClaimType): number {
  let confidence = 0.5;

  // Higher confidence for specific types
  if (['factual', 'statistic', 'pricing'].includes(type)) {
    confidence += 0.2;
  }

  // Higher confidence for claims with numbers
  if (/\d+/.test(text)) {
    confidence += 0.1;
  }

  // Higher confidence for proper nouns
  if (/[A-Z][a-z]+/.test(text)) {
    confidence += 0.1;
  }

  // Lower confidence for very long claims
  if (text.length > 200) {
    confidence -= 0.2;
  }

  return Math.min(1, Math.max(0, confidence));
}

/**
 * Extract named entities from claim text
 */
function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // Extract capitalized words (potential proper nouns)
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (properNouns) {
    entities.push(...properNouns);
  }

  // Extract numbers with context
  const numbers = text.match(/\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|%|percent|users?|customers?|dollars?|\$))?/gi);
  if (numbers) {
    entities.push(...numbers);
  }

  // Extract years
  const years = text.match(/\b(?:19|20)\d{2}\b/g);
  if (years) {
    entities.push(...years);
  }

  return [...new Set(entities)];
}

// ================================================================
// CLAIM VERIFICATION
// ================================================================

/**
 * Verify a claim against website data
 */
export function verifyClaim(claim: ExtractedClaim, websiteData: WebsiteData): ClaimVerification {
  // Combine all available content for searching
  const searchContent = [
    websiteData.content,
    websiteData.title,
    websiteData.metaDescription,
    websiteData.aboutContent,
    ...(websiteData.pricing || []),
    ...(websiteData.products || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Get entities and keywords from claim
  const claimLower = claim.text.toLowerCase();
  const keywords = extractKeywords(claim.text);

  // Check for direct matches
  const directMatch = findDirectMatch(claimLower, searchContent);
  if (directMatch) {
    return {
      claim,
      status: 'verified',
      confidence: 0.9,
      evidence: directMatch,
      reason: 'Direct match found in website content',
    };
  }

  // Check for semantic matches
  const semanticMatch = findSemanticMatch(keywords, searchContent);
  if (semanticMatch.found) {
    return {
      claim,
      status: semanticMatch.confidence > 0.7 ? 'verified' : 'partial',
      confidence: semanticMatch.confidence,
      evidence: semanticMatch.evidence,
      reason: `Semantic match: ${semanticMatch.matchedKeywords.length}/${keywords.length} keywords found`,
    };
  }

  // Check for contradictions
  const contradiction = findContradiction(claim, websiteData);
  if (contradiction) {
    return {
      claim,
      status: 'contradicted',
      confidence: contradiction.confidence,
      evidence: contradiction.evidence,
      reason: contradiction.reason,
    };
  }

  // Type-specific verification
  const typeSpecific = verifyByType(claim, websiteData);
  if (typeSpecific) {
    return typeSpecific;
  }

  // Default to unverified
  return {
    claim,
    status: 'unverified',
    confidence: 0.5,
    reason: 'No supporting or contradicting evidence found',
  };
}

/**
 * Extract keywords from claim for matching
 */
function extractKeywords(text: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Find direct match in content
 */
function findDirectMatch(claim: string, content: string): string | null {
  // Look for claim text directly in content
  const index = content.indexOf(claim);
  if (index !== -1) {
    // Extract surrounding context
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + claim.length + 50);
    return content.substring(start, end);
  }
  return null;
}

/**
 * Find semantic match based on keywords
 */
function findSemanticMatch(
  keywords: string[],
  content: string
): { found: boolean; confidence: number; matchedKeywords: string[]; evidence?: string } {
  const matchedKeywords: string[] = [];
  let evidenceSnippet = '';

  for (const keyword of keywords) {
    const index = content.indexOf(keyword);
    if (index !== -1) {
      matchedKeywords.push(keyword);
      if (!evidenceSnippet) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + keyword.length + 100);
        evidenceSnippet = content.substring(start, end);
      }
    }
  }

  const confidence = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;

  return {
    found: confidence > 0.5,
    confidence,
    matchedKeywords,
    evidence: evidenceSnippet || undefined,
  };
}

/**
 * Find contradicting information
 */
function findContradiction(
  claim: ExtractedClaim,
  websiteData: WebsiteData
): { confidence: number; evidence: string; reason: string } | null {
  // Check for year contradictions
  if (claim.type === 'factual' || claim.type === 'temporal') {
    const claimYear = claim.text.match(/\b(19|20)\d{2}\b/)?.[0];
    if (claimYear && websiteData.foundedYear) {
      const foundedYearStr = websiteData.foundedYear.toString();
      if (claim.text.toLowerCase().includes('founded') && claimYear !== foundedYearStr) {
        return {
          confidence: 0.9,
          evidence: `Website indicates founded in ${websiteData.foundedYear}`,
          reason: `Claim mentions ${claimYear} but website shows ${websiteData.foundedYear}`,
        };
      }
    }
  }

  // Check for location contradictions
  if (claim.type === 'location' && websiteData.headquarters) {
    const claimLocation = claim.text.toLowerCase();
    const actualLocation = websiteData.headquarters.toLowerCase();

    // Simple check - if claim mentions a city not in actual location
    const majorCities = ['new york', 'san francisco', 'london', 'tokyo', 'paris', 'berlin'];
    for (const city of majorCities) {
      if (claimLocation.includes(city) && !actualLocation.includes(city)) {
        return {
          confidence: 0.7,
          evidence: `Website shows headquarters: ${websiteData.headquarters}`,
          reason: `Claim suggests ${city} but website indicates ${websiteData.headquarters}`,
        };
      }
    }
  }

  return null;
}

/**
 * Type-specific verification logic
 */
function verifyByType(claim: ExtractedClaim, websiteData: WebsiteData): ClaimVerification | null {
  switch (claim.type) {
    case 'contact':
      return verifyContactClaim(claim, websiteData);
    case 'pricing':
      return verifyPricingClaim(claim, websiteData);
    case 'product':
      return verifyProductClaim(claim, websiteData);
    default:
      return null;
  }
}

function verifyContactClaim(claim: ExtractedClaim, websiteData: WebsiteData): ClaimVerification | null {
  if (!websiteData.contactInfo) return null;

  const claimText = claim.text.toLowerCase();
  const { email, phone, address } = websiteData.contactInfo;

  if (email && claimText.includes(email.toLowerCase())) {
    return {
      claim,
      status: 'verified',
      confidence: 0.95,
      evidence: `Email: ${email}`,
      reason: 'Email matches website contact information',
    };
  }

  if (phone && claimText.includes(phone.replace(/\D/g, ''))) {
    return {
      claim,
      status: 'verified',
      confidence: 0.95,
      evidence: `Phone: ${phone}`,
      reason: 'Phone matches website contact information',
    };
  }

  return null;
}

function verifyPricingClaim(claim: ExtractedClaim, websiteData: WebsiteData): ClaimVerification | null {
  if (!websiteData.pricing || websiteData.pricing.length === 0) return null;

  const claimPrices = claim.text.match(/\$[\d,]+(?:\.\d{2})?/g);
  if (!claimPrices) return null;

  for (const price of claimPrices) {
    for (const websitePrice of websiteData.pricing) {
      if (websitePrice.includes(price)) {
        return {
          claim,
          status: 'verified',
          confidence: 0.9,
          evidence: websitePrice,
          reason: `Price ${price} found in website pricing`,
        };
      }
    }
  }

  return {
    claim,
    status: 'unverified',
    confidence: 0.6,
    reason: 'Price not found in website pricing information',
  };
}

function verifyProductClaim(claim: ExtractedClaim, websiteData: WebsiteData): ClaimVerification | null {
  if (!websiteData.products || websiteData.products.length === 0) return null;

  const claimLower = claim.text.toLowerCase();

  for (const product of websiteData.products) {
    if (claimLower.includes(product.toLowerCase())) {
      return {
        claim,
        status: 'verified',
        confidence: 0.85,
        evidence: `Product: ${product}`,
        reason: `Product name "${product}" found in claim`,
      };
    }
  }

  return null;
}

// ================================================================
// MAIN DETECTION FUNCTION
// ================================================================

/**
 * Detect hallucinations in AI response by comparing with website data
 */
export function detectHallucinations(
  aiResponse: string,
  websiteData: WebsiteData
): HallucinationReport {
  // Extract claims from AI response
  const claims = extractClaims(aiResponse);

  // Verify each claim
  const verifications = claims.map(claim => verifyClaim(claim, websiteData));

  // Calculate statistics
  const verified = verifications.filter(v => v.status === 'verified').length;
  const contradicted = verifications.filter(v => v.status === 'contradicted').length;
  const unverified = verifications.filter(v => v.status === 'unverified').length;
  const partial = verifications.filter(v => v.status === 'partial').length;

  // Calculate hallucination score
  // Higher score = more hallucination risk
  const totalClaims = claims.length;
  let score = 0;

  if (totalClaims > 0) {
    // Contradicted claims are the strongest indicator
    score += (contradicted / totalClaims) * 0.5;
    // Unverified claims contribute moderately
    score += (unverified / totalClaims) * 0.3;
    // Partial verifications contribute slightly
    score += (partial / totalClaims) * 0.1;
    // Subtract for verified claims
    score -= (verified / totalClaims) * 0.2;

    score = Math.max(0, Math.min(1, score));
  }

  // Determine risk level
  let riskLevel: HallucinationReport['riskLevel'];
  if (score < 0.2) {
    riskLevel = 'low';
  } else if (score < 0.4) {
    riskLevel = 'medium';
  } else if (score < 0.6) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  // Generate summary
  const summary = generateSummary(verifications, score, riskLevel);

  return {
    score,
    totalClaims,
    verifiedClaims: verified,
    contradictedClaims: contradicted,
    unverifiedClaims: unverified,
    verifications,
    riskLevel,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  verifications: ClaimVerification[],
  score: number,
  riskLevel: HallucinationReport['riskLevel']
): string {
  const total = verifications.length;

  if (total === 0) {
    return 'No verifiable claims were extracted from the AI response.';
  }

  const verified = verifications.filter(v => v.status === 'verified').length;
  const contradicted = verifications.filter(v => v.status === 'contradicted').length;

  let summary = `Analyzed ${total} claims from AI response. `;

  if (riskLevel === 'low') {
    summary += `${verified} claims verified against website data. Low hallucination risk.`;
  } else if (riskLevel === 'medium') {
    summary += `${verified} verified, ${total - verified} could not be fully verified. Moderate hallucination risk.`;
  } else if (riskLevel === 'high') {
    summary += `Only ${verified} verified, ${contradicted} contradicted by website. High hallucination risk.`;
  } else {
    summary += `Critical: ${contradicted} claims directly contradict website data. Manual review recommended.`;
  }

  return summary;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectHallucinations,
  extractClaims,
  verifyClaim,
};
