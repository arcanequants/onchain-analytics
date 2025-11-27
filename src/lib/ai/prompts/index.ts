/**
 * AI Prompt Templates & Configuration
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Sections 2.54, 2.55, 2.60
 *
 * Implements:
 * - Chain-of-Thought (CoT) prompting for better reasoning
 * - Few-shot examples for consistent output format
 * - Temperature matrix by task type
 * - Model-specific optimizations
 */

// ================================================================
// TYPES
// ================================================================

export type PromptType =
  | 'industry_detection'
  | 'perception_query'
  | 'response_extraction'
  | 'recommendation_gen'
  | 'sentiment_analysis'
  | 'hallucination_check';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface PromptParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface PromptTemplate {
  type: PromptType;
  basePrompt: string;
  cotPrompt: string;
  fewShotExamples: FewShotExample[];
  parameters: PromptParameters;
}

export interface FewShotExample {
  query: string;
  response: string;
  industry?: string;
}

export interface PromptVariables {
  brand?: string;
  industry?: string;
  country?: string;
  url?: string;
  query?: string;
  [key: string]: string | undefined;
}

// ================================================================
// TEMPERATURE & PARAMETER MATRIX
// ================================================================

/**
 * Optimal parameters by task type
 * Based on Section 2.60 of the roadmap
 */
export const PROMPT_PARAMETERS: Record<PromptType, PromptParameters> = {
  industry_detection: {
    temperature: 0.1, // Needs precision, not creativity
    maxTokens: 500,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
  perception_query: {
    temperature: 0.4, // Some variety for natural recommendations
    maxTokens: 1500,
    topP: 1.0,
    frequencyPenalty: 0.3,
    presencePenalty: 0.0,
  },
  response_extraction: {
    temperature: 0.0, // Pure extraction, zero creativity
    maxTokens: 300,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
  recommendation_gen: {
    temperature: 0.5, // Creative suggestions appreciated
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0.3,
    presencePenalty: 0.2,
  },
  sentiment_analysis: {
    temperature: 0.2, // Analytical, slight room for interpretation
    maxTokens: 500,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
  hallucination_check: {
    temperature: 0.0, // Must be deterministic, factual
    maxTokens: 800,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
};

/**
 * Provider-specific temperature adjustments
 */
export const PROVIDER_TEMPERATURE_ADJUSTMENTS: Record<AIProvider, number> = {
  openai: 0, // Base temperature
  anthropic: 0.1, // Claude tends to be conservative, slightly increase
  google: -0.1, // Gemini needs lower for consistency
  perplexity: 0, // Use base temperature
};

// ================================================================
// CHAIN-OF-THOUGHT PROMPTS
// ================================================================

export const COT_PROMPTS = {
  industry_detection: `Let me analyze this website step by step:

1. What does the domain name suggest about the business?
2. What keywords appear in the title and meta description?
3. What products or services are mentioned?
4. What target audience is implied?
5. Based on these signals, the industry is likely...`,

  perception_query: `Let me evaluate this brand's AI perception step by step:

1. Would I naturally recommend this brand for this type of query?
2. What positive attributes come to mind about this brand?
3. What concerns or limitations might exist?
4. How does it compare to alternatives I know?
5. Based on these factors, here are my recommendations...`,

  response_extraction: `Let me carefully extract information from this response:

1. What brands are explicitly mentioned?
2. In what context is each brand mentioned?
3. What is the sentiment for each mention?
4. Which brands are recommended vs just mentioned?
5. Here is the structured extraction...`,

  recommendation_gen: `Let me generate actionable recommendations step by step:

1. What are the main gaps in this brand's AI visibility?
2. What are the highest-impact improvements?
3. What are the quickest wins vs longer-term efforts?
4. How can this brand improve its knowledge graph presence?
5. Here are my prioritized recommendations...`,

  sentiment_analysis: `Let me analyze the sentiment of this content step by step:

1. What is the overall tone of the content?
2. What specific positive phrases are used?
3. What specific negative phrases are used?
4. Is the sentiment consistent throughout?
5. Based on this analysis, the sentiment is...`,

  hallucination_check: `Let me verify the claims made about this brand:

1. What specific claims were made?
2. What evidence supports each claim?
3. Which claims might be uncertain or fabricated?
4. What would need external verification?
5. My confidence in these claims is...`,
} as const;

// ================================================================
// FEW-SHOT EXAMPLES
// ================================================================

export const FEW_SHOT_EXAMPLES: Record<PromptType, FewShotExample[]> = {
  industry_detection: [
    {
      query: 'https://stripe.com - Stripe | Payment Processing Platform',
      response: `{
  "industry": "fintech",
  "subIndustry": "payment-processing",
  "country": "US",
  "entityType": "business",
  "competitors": ["PayPal", "Square", "Adyen", "Braintree"],
  "confidence": 0.95,
  "reasoning": "Clear payment processing platform with developer-focused API tools"
}`,
    },
    {
      query: 'https://notion.so - Notion - Your connected workspace',
      response: `{
  "industry": "saas",
  "subIndustry": "productivity-software",
  "country": "US",
  "entityType": "product",
  "competitors": ["Confluence", "Coda", "Slite", "Roam Research"],
  "confidence": 0.92,
  "reasoning": "Productivity workspace combining docs, wikis, and project management"
}`,
    },
  ],

  perception_query: [
    {
      query: "What's the best project management tool for remote teams?",
      response: `For remote teams, I'd strongly recommend:

1. **Asana** - Excellent for workflow visualization and integrations with Slack, ideal for marketing teams.
2. **Monday.com** - Very visual, great for non-technical users who need flexibility.
3. **Notion** - Combines docs + project management, perfect for startups wanting an all-in-one solution.
4. **ClickUp** - Most features for the price, but steeper learning curve.
5. **Trello** - Simple Kanban boards, best for small teams with straightforward workflows.

Each has a free tier to start, so I'd recommend trying 2-3 to see which fits your workflow best.`,
      industry: 'saas',
    },
    {
      query: 'Best CRM for real estate agents in the US?',
      response: `For US real estate agents, I recommend:

1. **Follow Up Boss** - Built specifically for real estate, excellent lead routing and mobile app.
2. **KVCore** - All-in-one platform popular with brokerages, includes IDX website and marketing automation.
3. **LionDesk** - Affordable option with good texting features and video email capabilities.
4. **Wise Agent** - User-friendly with strong transaction management features.
5. **HubSpot** - Free tier available, good if you want CRM + marketing automation together.

The best choice depends on your budget and whether you need IDX integration.`,
      industry: 'real-estate',
    },
  ],

  response_extraction: [
    {
      query:
        'Extract brand mentions from: "For email marketing, I recommend Mailchimp for beginners and ConvertKit for creators. Avoid SendGrid if you need marketing automation."',
      response: `{
  "mentions": [
    {
      "brandName": "Mailchimp",
      "position": 1,
      "sentiment": "positive",
      "isRecommended": true,
      "context": "recommended for beginners"
    },
    {
      "brandName": "ConvertKit",
      "position": 2,
      "sentiment": "positive",
      "isRecommended": true,
      "context": "recommended for creators"
    },
    {
      "brandName": "SendGrid",
      "position": 3,
      "sentiment": "negative",
      "isRecommended": false,
      "context": "advised against for marketing automation"
    }
  ],
  "totalMentions": 3
}`,
    },
  ],

  recommendation_gen: [
    {
      query: 'Brand: Acme Corp, Score: 35, Industry: SaaS, Missing: Schema.org, Wikipedia, Reviews',
      response: `{
  "recommendations": [
    {
      "id": "rec-001",
      "title": "Add Schema.org SoftwareApplication markup",
      "priority": "high",
      "category": "structured-data",
      "estimatedImpact": 15,
      "estimatedEffortHours": 4,
      "actionItems": [
        "Add JSON-LD script to homepage",
        "Include offers, features, and reviews schema",
        "Test with Google Rich Results Test"
      ]
    },
    {
      "id": "rec-002",
      "title": "Create Wikipedia presence",
      "priority": "high",
      "category": "authority",
      "estimatedImpact": 20,
      "estimatedEffortHours": 40,
      "actionItems": [
        "Gather notable citations from press coverage",
        "Draft Wikipedia article following notability guidelines",
        "Submit for review"
      ]
    }
  ],
  "summary": "Focus on structured data and authority building",
  "currentScore": 35,
  "projectedScore": 70
}`,
    },
  ],

  sentiment_analysis: [
    {
      query:
        'Analyze sentiment: "Stripe is incredibly developer-friendly with excellent documentation, though their pricing can be higher than competitors for small businesses."',
      response: `{
  "overallSentiment": "positive",
  "sentimentScore": 0.6,
  "confidence": 0.9,
  "aspectSentiments": [
    { "aspect": "developer experience", "sentiment": "positive", "score": 0.9 },
    { "aspect": "documentation", "sentiment": "positive", "score": 0.95 },
    { "aspect": "pricing", "sentiment": "negative", "score": -0.4 }
  ],
  "positiveThemes": ["developer-friendly", "excellent documentation"],
  "negativeThemes": ["higher pricing for small businesses"]
}`,
    },
  ],

  hallucination_check: [
    {
      query: 'Verify: "Stripe was founded in 2010 and processes over $1 trillion annually"',
      response: `{
  "claim": "Stripe was founded in 2010 and processes over $1 trillion annually",
  "isVerifiable": true,
  "verificationStatus": "verified",
  "confidence": 0.95,
  "sources": [
    { "name": "Stripe About Page", "supports": true, "relevance": 0.95 },
    { "name": "Forbes", "supports": true, "relevance": 0.9 }
  ],
  "correction": null,
  "riskLevel": "low"
}`,
    },
  ],
};

// ================================================================
// BASE PROMPTS
// ================================================================

export const BASE_PROMPTS: Record<PromptType, string> = {
  industry_detection: `You are an expert business analyst. Given a website URL and its metadata, determine the industry, sub-industry, country, entity type, and likely competitors.

Respond with a valid JSON object matching this structure:
{
  "industry": "string (from our taxonomy)",
  "subIndustry": "string or null",
  "country": "ISO 3166-1 alpha-2 code or null",
  "entityType": "business | personal | product | service | organization",
  "competitors": ["array", "of", "up to 5 competitors"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`,

  perception_query: `You are a knowledgeable advisor helping people find the best solutions for their needs. When asked about recommendations in any industry, provide helpful, balanced advice based on your knowledge.

For each recommendation:
- Explain why you're recommending it
- Note any specific use cases or audience fit
- Be honest about limitations
- Order by relevance to the query`,

  response_extraction: `You are a precise data extraction system. Given an AI-generated response about product/service recommendations, extract all brand mentions with their context, sentiment, and position.

Respond with a valid JSON object matching the BrandMentionsResponse schema.`,

  recommendation_gen: `You are an AI visibility optimization expert. Given a brand's current AI perception score and gaps, generate specific, actionable recommendations to improve their visibility in AI-generated responses.

Prioritize recommendations by:
1. Impact on AI visibility (potential score increase)
2. Effort required
3. Quick wins vs long-term investments

Respond with a valid JSON object matching the RecommendationsResponse schema.`,

  sentiment_analysis: `You are a sentiment analysis expert. Analyze the sentiment of brand mentions in the provided text, identifying overall sentiment, aspect-based sentiment, and key themes.

Respond with a valid JSON object matching the SentimentAnalysis schema.`,

  hallucination_check: `You are a fact-checking expert. Verify claims made about brands by assessing their accuracy, providing confidence levels, and suggesting corrections where needed.

Be conservative in verification - when uncertain, mark as "unverifiable" rather than guessing.

Respond with a valid JSON object matching the HallucinationCheck schema.`,
};

// ================================================================
// PROMPT BUILDERS
// ================================================================

/**
 * Replace template variables in a prompt string
 */
export function interpolatePrompt(template: string, variables: PromptVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }
  return result;
}

/**
 * Build a complete prompt with CoT and few-shot examples
 */
export function buildPrompt(
  type: PromptType,
  variables: PromptVariables,
  options?: {
    includeCoT?: boolean;
    includeFewShot?: boolean;
    fewShotCount?: number;
    customExamples?: FewShotExample[];
  }
): string {
  const { includeCoT = true, includeFewShot = true, fewShotCount = 2, customExamples } = options || {};

  const parts: string[] = [];

  // 1. Base prompt (system context)
  parts.push(BASE_PROMPTS[type]);

  // 2. Few-shot examples
  if (includeFewShot) {
    const examples = customExamples || FEW_SHOT_EXAMPLES[type];
    const selectedExamples = examples.slice(0, fewShotCount);

    if (selectedExamples.length > 0) {
      parts.push('\n=== Examples ===\n');
      selectedExamples.forEach((example, index) => {
        parts.push(`Example ${index + 1}:`);
        parts.push(`Query: ${example.query}`);
        parts.push(`Response: ${example.response}\n`);
      });
    }
  }

  // 3. Chain-of-Thought instruction
  if (includeCoT) {
    parts.push('\n=== Your Analysis ===\n');
    parts.push(COT_PROMPTS[type]);
  }

  // 4. User query with variables
  parts.push('\n=== Your Query ===\n');
  if (variables.query) {
    parts.push(`Query: ${variables.query}`);
  }
  if (variables.brand) {
    parts.push(`Brand: ${variables.brand}`);
  }
  if (variables.industry) {
    parts.push(`Industry: ${variables.industry}`);
  }
  if (variables.url) {
    parts.push(`URL: ${variables.url}`);
  }
  if (variables.country) {
    parts.push(`Country: ${variables.country}`);
  }

  parts.push('\nResponse:');

  return parts.join('\n');
}

/**
 * Get parameters adjusted for specific provider
 */
export function getProviderParameters(
  type: PromptType,
  provider: AIProvider
): PromptParameters {
  const baseParams = { ...PROMPT_PARAMETERS[type] };
  const adjustment = PROVIDER_TEMPERATURE_ADJUSTMENTS[provider];

  // Adjust temperature within valid range
  baseParams.temperature = Math.max(0, Math.min(1, baseParams.temperature + adjustment));

  return baseParams;
}

/**
 * Get system prompt for a specific provider
 */
export function getSystemPrompt(type: PromptType, provider: AIProvider): string {
  const baseSystemPrompt = BASE_PROMPTS[type];

  // Provider-specific modifications
  switch (provider) {
    case 'openai':
      return `${baseSystemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation text.`;

    case 'anthropic':
      return `${baseSystemPrompt}\n\nPlease structure your response within <output></output> tags, containing valid JSON.`;

    case 'google':
      return `${baseSystemPrompt}\n\nFormat your response as a valid JSON object.`;

    case 'perplexity':
      return baseSystemPrompt; // Perplexity has its own format

    default:
      return baseSystemPrompt;
  }
}

// ================================================================
// PROMPT TEMPLATES (COMBINED)
// ================================================================

export const PROMPT_TEMPLATES: Record<PromptType, PromptTemplate> = {
  industry_detection: {
    type: 'industry_detection',
    basePrompt: BASE_PROMPTS.industry_detection,
    cotPrompt: COT_PROMPTS.industry_detection,
    fewShotExamples: FEW_SHOT_EXAMPLES.industry_detection,
    parameters: PROMPT_PARAMETERS.industry_detection,
  },
  perception_query: {
    type: 'perception_query',
    basePrompt: BASE_PROMPTS.perception_query,
    cotPrompt: COT_PROMPTS.perception_query,
    fewShotExamples: FEW_SHOT_EXAMPLES.perception_query,
    parameters: PROMPT_PARAMETERS.perception_query,
  },
  response_extraction: {
    type: 'response_extraction',
    basePrompt: BASE_PROMPTS.response_extraction,
    cotPrompt: COT_PROMPTS.response_extraction,
    fewShotExamples: FEW_SHOT_EXAMPLES.response_extraction,
    parameters: PROMPT_PARAMETERS.response_extraction,
  },
  recommendation_gen: {
    type: 'recommendation_gen',
    basePrompt: BASE_PROMPTS.recommendation_gen,
    cotPrompt: COT_PROMPTS.recommendation_gen,
    fewShotExamples: FEW_SHOT_EXAMPLES.recommendation_gen,
    parameters: PROMPT_PARAMETERS.recommendation_gen,
  },
  sentiment_analysis: {
    type: 'sentiment_analysis',
    basePrompt: BASE_PROMPTS.sentiment_analysis,
    cotPrompt: COT_PROMPTS.sentiment_analysis,
    fewShotExamples: FEW_SHOT_EXAMPLES.sentiment_analysis,
    parameters: PROMPT_PARAMETERS.sentiment_analysis,
  },
  hallucination_check: {
    type: 'hallucination_check',
    basePrompt: BASE_PROMPTS.hallucination_check,
    cotPrompt: COT_PROMPTS.hallucination_check,
    fewShotExamples: FEW_SHOT_EXAMPLES.hallucination_check,
    parameters: PROMPT_PARAMETERS.hallucination_check,
  },
};

// ================================================================
// EXPORTS
// ================================================================

export default {
  PROMPT_PARAMETERS,
  PROVIDER_TEMPERATURE_ADJUSTMENTS,
  COT_PROMPTS,
  FEW_SHOT_EXAMPLES,
  BASE_PROMPTS,
  PROMPT_TEMPLATES,
  interpolatePrompt,
  buildPrompt,
  getProviderParameters,
  getSystemPrompt,
};
