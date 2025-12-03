/**
 * Brand Perception Ontology
 *
 * Phase 4, Week 8 Extended - Ontology Engineering Checklist
 *
 * Features:
 * - OWL/SKOS-inspired ontology for brand perception
 * - Entity alignments to Wikidata
 * - NAICS/ISIC industry codes
 * - Provenance tracking (PROV-O inspired)
 * - Temporal validity for relationships
 * - Multi-lingual labels (EN, ES, PT)
 */

// ============================================================================
// NAMESPACE & VERSION
// ============================================================================

export const ONTOLOGY_NAMESPACE = 'https://aiperception.com/ontology/v1#';
export const ONTOLOGY_VERSION = '1.0.0';
export const ONTOLOGY_DATE = '2024-12-01';

// ============================================================================
// CORE TYPES
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ProvenanceType = 'ai_derived' | 'user_provided' | 'external_source' | 'inferred';

export interface MultilingualLabel {
  en: string;
  es?: string;
  pt?: string;
  fr?: string;
  de?: string;
}

export interface TemporalValidity {
  validFrom: string; // ISO date
  validTo?: string;  // ISO date, null = current
}

export interface Provenance {
  type: ProvenanceType;
  source: string;
  confidence: number; // 0.0 - 1.0
  generatedAt: string;
  generatedBy: string; // agent/model ID
  wasInformedBy?: string[]; // source entity URIs
}

export interface OntologyEntity {
  uri: string;
  type: string;
  labels: MultilingualLabel;
  description?: MultilingualLabel;
  sameAs?: string[]; // Wikidata, DBpedia URIs
  provenance: Provenance;
  validity?: TemporalValidity;
}

// ============================================================================
// BRAND ENTITY
// ============================================================================

export interface Brand extends OntologyEntity {
  type: 'aip:Brand';
  name: string;
  website: string;
  industry: IndustryCode;
  headquarters?: string;
  foundedYear?: number;
  employees?: string; // "1-10", "11-50", etc.
  parentCompany?: string; // URI reference
  subsidiaries?: string[]; // URI references
  competitors?: CompetitorRelation[];
  perceptionScores?: PerceptionScore[];
}

export interface CompetitorRelation {
  competitor: string; // URI reference
  relationshipType: 'direct' | 'indirect' | 'substitute';
  similarity: number; // 0.0 - 1.0 (Wu-Palmer or feature-based)
  validity: TemporalValidity;
  provenance: Provenance;
}

export interface PerceptionScore {
  provider: string; // aip:OpenAI, aip:Anthropic, etc.
  score: number;
  confidence: number;
  dimensions: PerceptionDimension[];
  measuredAt: string;
  provenance: Provenance;
}

export interface PerceptionDimension {
  dimension: string; // visibility, sentiment, accuracy, recommendation
  score: number;
  confidence: number;
}

// ============================================================================
// INDUSTRY CLASSIFICATION
// ============================================================================

export interface IndustryCode {
  naics?: string;      // North American Industry Classification System
  isic?: string;       // International Standard Industrial Classification
  aiPerception: string; // Our internal industry ID
  labels: MultilingualLabel;
}

/**
 * NAICS to ISIC mapping for top 20 industries
 */
export const INDUSTRY_MAPPINGS: Record<string, IndustryCode> = {
  'technology-software': {
    naics: '5112',
    isic: '6201',
    aiPerception: 'technology-software',
    labels: {
      en: 'Software Publishers',
      es: 'Editores de Software',
      pt: 'Editoras de Software',
    },
  },
  'technology-hardware': {
    naics: '3341',
    isic: '2620',
    aiPerception: 'technology-hardware',
    labels: {
      en: 'Computer Equipment Manufacturing',
      es: 'Fabricación de Equipos Informáticos',
      pt: 'Fabricação de Equipamentos de Informática',
    },
  },
  'ecommerce': {
    naics: '4541',
    isic: '4791',
    aiPerception: 'ecommerce',
    labels: {
      en: 'Electronic Shopping',
      es: 'Comercio Electrónico',
      pt: 'Comércio Eletrônico',
    },
  },
  'financial-services': {
    naics: '5231',
    isic: '6611',
    aiPerception: 'financial-services',
    labels: {
      en: 'Financial Services',
      es: 'Servicios Financieros',
      pt: 'Serviços Financeiros',
    },
  },
  'healthcare': {
    naics: '6211',
    isic: '8610',
    aiPerception: 'healthcare',
    labels: {
      en: 'Healthcare & Medical',
      es: 'Salud y Medicina',
      pt: 'Saúde e Medicina',
    },
  },
  'education': {
    naics: '6111',
    isic: '8510',
    aiPerception: 'education',
    labels: {
      en: 'Educational Services',
      es: 'Servicios Educativos',
      pt: 'Serviços Educacionais',
    },
  },
  'retail': {
    naics: '4411',
    isic: '4711',
    aiPerception: 'retail',
    labels: {
      en: 'Retail Trade',
      es: 'Comercio Minorista',
      pt: 'Comércio Varejista',
    },
  },
  'manufacturing': {
    naics: '3111',
    isic: '1010',
    aiPerception: 'manufacturing',
    labels: {
      en: 'Manufacturing',
      es: 'Manufactura',
      pt: 'Manufatura',
    },
  },
  'hospitality': {
    naics: '7211',
    isic: '5510',
    aiPerception: 'hospitality',
    labels: {
      en: 'Hospitality & Travel',
      es: 'Hospitalidad y Viajes',
      pt: 'Hospitalidade e Viagens',
    },
  },
  'real-estate': {
    naics: '5311',
    isic: '6810',
    aiPerception: 'real-estate',
    labels: {
      en: 'Real Estate',
      es: 'Bienes Raíces',
      pt: 'Imobiliário',
    },
  },
  'legal': {
    naics: '5411',
    isic: '6910',
    aiPerception: 'legal',
    labels: {
      en: 'Legal Services',
      es: 'Servicios Legales',
      pt: 'Serviços Jurídicos',
    },
  },
  'consulting': {
    naics: '5416',
    isic: '7020',
    aiPerception: 'consulting',
    labels: {
      en: 'Management Consulting',
      es: 'Consultoría de Gestión',
      pt: 'Consultoria de Gestão',
    },
  },
  'marketing-advertising': {
    naics: '5418',
    isic: '7310',
    aiPerception: 'marketing-advertising',
    labels: {
      en: 'Marketing & Advertising',
      es: 'Marketing y Publicidad',
      pt: 'Marketing e Publicidade',
    },
  },
  'media-entertainment': {
    naics: '5121',
    isic: '5911',
    aiPerception: 'media-entertainment',
    labels: {
      en: 'Media & Entertainment',
      es: 'Medios y Entretenimiento',
      pt: 'Mídia e Entretenimento',
    },
  },
  'automotive': {
    naics: '3361',
    isic: '2910',
    aiPerception: 'automotive',
    labels: {
      en: 'Automotive',
      es: 'Automotriz',
      pt: 'Automotivo',
    },
  },
  'food-beverage': {
    naics: '3121',
    isic: '1101',
    aiPerception: 'food-beverage',
    labels: {
      en: 'Food & Beverage',
      es: 'Alimentos y Bebidas',
      pt: 'Alimentos e Bebidas',
    },
  },
  'energy': {
    naics: '2211',
    isic: '3510',
    aiPerception: 'energy',
    labels: {
      en: 'Energy & Utilities',
      es: 'Energía y Servicios Públicos',
      pt: 'Energia e Serviços Públicos',
    },
  },
  'telecommunications': {
    naics: '5171',
    isic: '6110',
    aiPerception: 'telecommunications',
    labels: {
      en: 'Telecommunications',
      es: 'Telecomunicaciones',
      pt: 'Telecomunicações',
    },
  },
  'agriculture': {
    naics: '1111',
    isic: '0111',
    aiPerception: 'agriculture',
    labels: {
      en: 'Agriculture',
      es: 'Agricultura',
      pt: 'Agricultura',
    },
  },
  'nonprofit': {
    naics: '8131',
    isic: '9499',
    aiPerception: 'nonprofit',
    labels: {
      en: 'Nonprofit & NGO',
      es: 'Sin Fines de Lucro y ONG',
      pt: 'Sem Fins Lucrativos e ONG',
    },
  },
};

// ============================================================================
// AI PROVIDER ENTITIES
// ============================================================================

export interface AIProvider extends OntologyEntity {
  type: 'aip:AIProvider';
  name: string;
  company: string;
  modelFamily: string;
  currentModel: string;
  apiEndpoint: string;
  capabilities: string[];
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    uri: `${ONTOLOGY_NAMESPACE}OpenAI`,
    type: 'aip:AIProvider',
    labels: { en: 'OpenAI', es: 'OpenAI', pt: 'OpenAI' },
    name: 'OpenAI',
    company: 'OpenAI',
    modelFamily: 'GPT',
    currentModel: 'gpt-4o',
    apiEndpoint: 'https://api.openai.com/v1',
    capabilities: ['text-generation', 'analysis', 'reasoning'],
    sameAs: ['https://www.wikidata.org/wiki/Q21198342'],
    provenance: {
      type: 'external_source',
      source: 'manual',
      confidence: 1.0,
      generatedAt: '2024-01-01',
      generatedBy: 'system',
    },
  },
  anthropic: {
    uri: `${ONTOLOGY_NAMESPACE}Anthropic`,
    type: 'aip:AIProvider',
    labels: { en: 'Anthropic', es: 'Anthropic', pt: 'Anthropic' },
    name: 'Anthropic',
    company: 'Anthropic',
    modelFamily: 'Claude',
    currentModel: 'claude-3-5-sonnet',
    apiEndpoint: 'https://api.anthropic.com/v1',
    capabilities: ['text-generation', 'analysis', 'reasoning', 'safety'],
    sameAs: ['https://www.wikidata.org/wiki/Q107224368'],
    provenance: {
      type: 'external_source',
      source: 'manual',
      confidence: 1.0,
      generatedAt: '2024-01-01',
      generatedBy: 'system',
    },
  },
  google: {
    uri: `${ONTOLOGY_NAMESPACE}Google`,
    type: 'aip:AIProvider',
    labels: { en: 'Google Gemini', es: 'Google Gemini', pt: 'Google Gemini' },
    name: 'Google Gemini',
    company: 'Google',
    modelFamily: 'Gemini',
    currentModel: 'gemini-pro',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    capabilities: ['text-generation', 'analysis', 'multimodal'],
    sameAs: ['https://www.wikidata.org/wiki/Q95'],
    provenance: {
      type: 'external_source',
      source: 'manual',
      confidence: 1.0,
      generatedAt: '2024-01-01',
      generatedBy: 'system',
    },
  },
  perplexity: {
    uri: `${ONTOLOGY_NAMESPACE}Perplexity`,
    type: 'aip:AIProvider',
    labels: { en: 'Perplexity', es: 'Perplexity', pt: 'Perplexity' },
    name: 'Perplexity',
    company: 'Perplexity AI',
    modelFamily: 'Sonar',
    currentModel: 'sonar-medium-online',
    apiEndpoint: 'https://api.perplexity.ai',
    capabilities: ['text-generation', 'web-search', 'citations'],
    provenance: {
      type: 'external_source',
      source: 'manual',
      confidence: 1.0,
      generatedAt: '2024-01-01',
      generatedBy: 'system',
    },
  },
};

// ============================================================================
// PERCEPTION DIMENSIONS (SKOS-style concept scheme)
// ============================================================================

export interface ConceptScheme {
  uri: string;
  prefLabel: MultilingualLabel;
  definition: MultilingualLabel;
  concepts: Concept[];
}

export interface Concept {
  uri: string;
  prefLabel: MultilingualLabel;
  definition: MultilingualLabel;
  broader?: string;
  narrower?: string[];
  related?: string[];
  notation?: string;
}

export const PERCEPTION_SCHEME: ConceptScheme = {
  uri: `${ONTOLOGY_NAMESPACE}PerceptionScheme`,
  prefLabel: {
    en: 'Brand Perception Dimensions',
    es: 'Dimensiones de Percepción de Marca',
    pt: 'Dimensões de Percepção de Marca',
  },
  definition: {
    en: 'A scheme for measuring how AI systems perceive and represent brands',
    es: 'Un esquema para medir cómo los sistemas de IA perciben y representan marcas',
    pt: 'Um esquema para medir como os sistemas de IA percebem e representam marcas',
  },
  concepts: [
    {
      uri: `${ONTOLOGY_NAMESPACE}Visibility`,
      prefLabel: { en: 'Visibility', es: 'Visibilidad', pt: 'Visibilidade' },
      definition: {
        en: 'How often and prominently the brand appears in AI responses',
        es: 'Con qué frecuencia y prominencia aparece la marca en respuestas de IA',
        pt: 'Com que frequência e destaque a marca aparece nas respostas de IA',
      },
      notation: 'VIS',
      narrower: [
        `${ONTOLOGY_NAMESPACE}MentionFrequency`,
        `${ONTOLOGY_NAMESPACE}PositionRanking`,
      ],
    },
    {
      uri: `${ONTOLOGY_NAMESPACE}Sentiment`,
      prefLabel: { en: 'Sentiment', es: 'Sentimiento', pt: 'Sentimento' },
      definition: {
        en: 'The emotional tone of AI responses when discussing the brand',
        es: 'El tono emocional de las respuestas de IA al discutir la marca',
        pt: 'O tom emocional das respostas de IA ao discutir a marca',
      },
      notation: 'SEN',
      narrower: [
        `${ONTOLOGY_NAMESPACE}PositiveSentiment`,
        `${ONTOLOGY_NAMESPACE}NegativeSentiment`,
        `${ONTOLOGY_NAMESPACE}NeutralSentiment`,
      ],
    },
    {
      uri: `${ONTOLOGY_NAMESPACE}Accuracy`,
      prefLabel: { en: 'Accuracy', es: 'Precisión', pt: 'Precisão' },
      definition: {
        en: 'How factually correct AI information about the brand is',
        es: 'Qué tan correcta factualmente es la información de IA sobre la marca',
        pt: 'Quão correta factualmente é a informação de IA sobre a marca',
      },
      notation: 'ACC',
      narrower: [
        `${ONTOLOGY_NAMESPACE}FactualCorrectness`,
        `${ONTOLOGY_NAMESPACE}HallucinationRate`,
      ],
    },
    {
      uri: `${ONTOLOGY_NAMESPACE}Recommendation`,
      prefLabel: { en: 'Recommendation', es: 'Recomendación', pt: 'Recomendação' },
      definition: {
        en: 'How likely AI is to recommend the brand',
        es: 'Qué tan probable es que la IA recomiende la marca',
        pt: 'Quão provável é que a IA recomende a marca',
      },
      notation: 'REC',
      narrower: [
        `${ONTOLOGY_NAMESPACE}DirectRecommendation`,
        `${ONTOLOGY_NAMESPACE}ComparisonAdvantage`,
      ],
    },
  ],
};

// ============================================================================
// WIKIDATA ALIGNMENT
// ============================================================================

export interface WikidataAlignment {
  brandUri: string;
  wikidataId: string;
  wikidataLabel: string;
  matchType: 'exact' | 'close' | 'related';
  confidence: number;
  verifiedAt?: string;
}

/**
 * Align brand to Wikidata entity
 */
export async function alignToWikidata(brandName: string): Promise<WikidataAlignment | null> {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(brandName)}&language=en&format=json&origin=*`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.search && data.search.length > 0) {
      const topResult = data.search[0];
      return {
        brandUri: `${ONTOLOGY_NAMESPACE}Brand/${brandName.toLowerCase().replace(/\s+/g, '-')}`,
        wikidataId: topResult.id,
        wikidataLabel: topResult.label,
        matchType: topResult.match?.type === 'label' ? 'exact' : 'close',
        confidence: topResult.match?.type === 'label' ? 0.9 : 0.7,
        verifiedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('Wikidata alignment failed:', error);
    return null;
  }
}

// ============================================================================
// SIMILARITY CALCULATION
// ============================================================================

/**
 * Calculate Wu-Palmer similarity between two concepts in ontology
 * Based on depth and lowest common subsumer
 */
export function calculateWuPalmerSimilarity(
  concept1Depth: number,
  concept2Depth: number,
  lcsDepth: number
): number {
  // Wu-Palmer formula: 2 * depth(LCS) / (depth(c1) + depth(c2))
  if (concept1Depth + concept2Depth === 0) return 0;
  return (2 * lcsDepth) / (concept1Depth + concept2Depth);
}

/**
 * Calculate feature-based similarity between brands
 */
export function calculateFeatureSimilarity(
  brand1Features: Set<string>,
  brand2Features: Set<string>
): number {
  const intersection = new Set([...brand1Features].filter(x => brand2Features.has(x)));
  const union = new Set([...brand1Features, ...brand2Features]);

  if (union.size === 0) return 0;
  return intersection.size / union.size; // Jaccard similarity
}

// ============================================================================
// JSON-LD EXPORT
// ============================================================================

export interface JsonLdBrand {
  '@context': Record<string, string>;
  '@type': string;
  '@id': string;
  name: string;
  url: string;
  industry: string;
  sameAs?: string[];
  additionalProperty?: Array<{
    '@type': string;
    name: string;
    value: number | string;
  }>;
}

/**
 * Export brand to Schema.org JSON-LD format
 */
export function exportToJsonLd(brand: Brand): JsonLdBrand {
  const jsonLd: JsonLdBrand = {
    '@context': {
      '@vocab': 'https://schema.org/',
      'aip': ONTOLOGY_NAMESPACE,
    },
    '@type': 'Organization',
    '@id': brand.uri,
    name: brand.name,
    url: brand.website,
    industry: brand.industry.labels.en,
  };

  if (brand.sameAs && brand.sameAs.length > 0) {
    jsonLd.sameAs = brand.sameAs;
  }

  if (brand.perceptionScores && brand.perceptionScores.length > 0) {
    const latestScore = brand.perceptionScores[0];
    jsonLd.additionalProperty = [
      {
        '@type': 'PropertyValue',
        name: 'aiPerceptionScore',
        value: latestScore.score,
      },
      {
        '@type': 'PropertyValue',
        name: 'aiPerceptionConfidence',
        value: latestScore.confidence,
      },
    ];
  }

  return jsonLd;
}

// ============================================================================
// COMPETENCY QUESTIONS
// ============================================================================

/**
 * 13 competency questions the ontology should answer
 */
export const COMPETENCY_QUESTIONS = [
  'What is the AI perception score for brand X?',
  'Which brands are competitors of brand X?',
  'What industry does brand X belong to?',
  'How does brand X compare to its competitors in AI visibility?',
  'What are the perception dimensions measured for brand X?',
  'Which AI provider gives brand X the highest score?',
  'How has brand X perception changed over time?',
  'What is the sentiment breakdown for brand X?',
  'Are there any hallucinations detected for brand X?',
  'What Wikidata entity corresponds to brand X?',
  'What is the confidence level for brand X scores?',
  'Who are the top 5 brands in industry Y?',
  'What recommendations exist for improving brand X perception?',
];

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ONTOLOGY_NAMESPACE,
  ONTOLOGY_VERSION,
  INDUSTRY_MAPPINGS,
  AI_PROVIDERS,
  PERCEPTION_SCHEME,
  COMPETENCY_QUESTIONS,
  alignToWikidata,
  calculateWuPalmerSimilarity,
  calculateFeatureSimilarity,
  exportToJsonLd,
};
