/**
 * Glossary Terms
 *
 * Comprehensive glossary of AI Perception and GEO terms
 * Phase 3, Week 10 - Content Backlog
 *
 * Categories:
 * - Core Concepts (6 terms)
 * - Metrics & Scoring (8 terms)
 * - Technical SEO (6 terms)
 * - AI & NLP (8 terms)
 * - Business & Strategy (6 terms)
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  shortDefinition: string;
  fullDefinition: string;
  examples?: string[];
  relatedTerms?: string[];
  icon: string;
  category: GlossaryCategory;
}

export type GlossaryCategory =
  | 'core'
  | 'metrics'
  | 'technical'
  | 'ai-nlp'
  | 'business';

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  core: 'Core Concepts',
  metrics: 'Metrics & Scoring',
  technical: 'Technical SEO',
  'ai-nlp': 'AI & NLP',
  business: 'Business & Strategy',
};

export const CATEGORY_DESCRIPTIONS: Record<GlossaryCategory, string> = {
  core: 'The fundamental concepts you need to understand AI perception',
  metrics: 'How we measure and quantify AI visibility and brand perception',
  technical: 'Technical aspects of optimizing for AI discovery',
  'ai-nlp': 'Understanding how AI models process and understand information',
  business: 'Strategic considerations for AI-driven brand visibility',
};

// ================================================================
// CORE CONCEPTS (6 terms)
// ================================================================

const CORE_TERMS: GlossaryTerm[] = [
  {
    id: 'ai-perception-score',
    term: 'AI Perception Score',
    category: 'core',
    shortDefinition:
      'A 0-100 measurement of how likely AI models are to recommend your brand.',
    fullDefinition: `The AI Perception Score measures how likely AI assistants like ChatGPT and Claude are to recommend your brand when users ask about your industry. A higher score means more visibility and recommendations from AI models.

The score is calculated by analyzing:
- How often AI mentions your brand when asked about your industry
- The sentiment (positive, neutral, or negative) of those mentions
- Whether AI recommends you specifically or just mentions you
- Your brand's authority signals that AI models recognize`,
    examples: [
      'A score of 85 means AI recommends you in most relevant queries',
      'A score of 45 means you appear sometimes but competitors dominate',
      'A score of 15 means AI rarely mentions you for your industry',
    ],
    relatedTerms: ['GEO', 'Share of Voice', 'E-E-A-T'],
    icon: '🎯',
  },
  {
    id: 'geo',
    term: 'GEO (Generative Engine Optimization)',
    category: 'core',
    shortDefinition: 'Like SEO, but for AI assistants instead of search engines.',
    fullDefinition: `Generative Engine Optimization (GEO) is the practice of optimizing your brand's presence for AI models. Just like SEO helps you rank higher in Google, GEO helps AI assistants like ChatGPT recommend you more often.

GEO involves:
- Ensuring your brand information is accurate across the web
- Building authority signals that AI models recognize
- Creating content that AI can understand and cite
- Getting listed in knowledge bases AI models trust (like Wikipedia and Wikidata)`,
    examples: [
      'Adding Schema.org markup so AI understands your business type',
      'Getting cited in reputable publications that AI models reference',
      'Ensuring your Wikipedia article (if you have one) is accurate',
    ],
    relatedTerms: ['AI Perception Score', 'Knowledge Graph', 'E-E-A-T'],
    icon: '🚀',
  },
  {
    id: 'share-of-voice',
    term: 'Share of Voice (SOV)',
    category: 'core',
    shortDefinition: 'The percentage of times AI mentions you vs. competitors.',
    fullDefinition: `Share of Voice measures what percentage of AI conversations about your industry include mentions of your brand compared to your competitors.

For example, if we ask ChatGPT 10 questions about "best CRM software" and your brand is mentioned in 3 of those responses, your Share of Voice is 30%.

A higher Share of Voice means:
- More visibility when users ask AI for recommendations
- Greater mindshare in AI-generated content
- More potential customers discovering your brand through AI`,
    examples: [
      'If Salesforce is mentioned in 6/10 CRM queries and you in 2/10, Salesforce has 60% SOV and you have 20%',
      'Improving from 15% to 35% SOV can significantly increase AI-driven leads',
    ],
    relatedTerms: ['AI Perception Score', 'GEO'],
    icon: '📊',
  },
  {
    id: 'eeat',
    term: 'E-E-A-T',
    category: 'core',
    shortDefinition:
      'Experience, Expertise, Authoritativeness, Trust - signals AI uses to evaluate brands.',
    fullDefinition: `E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trust. Originally Google's quality framework, AI models also use these signals to determine which brands to recommend.

The four components:
- **Experience**: First-hand experience with the topic
- **Expertise**: Deep knowledge in a specific field
- **Authoritativeness**: Recognition from others in the industry
- **Trust**: Reliability and accuracy of information

AI models learn E-E-A-T signals from:
- Customer reviews and testimonials
- Industry awards and certifications
- Press coverage and expert mentions
- Quality of your content and website`,
    examples: [
      'A doctor writing about medicine shows expertise',
      'Being cited by industry publications shows authoritativeness',
      'Consistent, accurate business information shows trust',
    ],
    relatedTerms: ['AI Perception Score', 'GEO', 'Knowledge Graph'],
    icon: '✅',
  },
  {
    id: 'hallucination',
    term: 'Hallucination',
    category: 'core',
    shortDefinition: 'When AI states incorrect information about your brand.',
    fullDefinition: `A hallucination occurs when an AI model confidently states something incorrect about your brand. This could be wrong products, incorrect locations, outdated pricing, or completely fabricated information.

Common hallucination examples:
- AI says you're based in New York when you're in Los Angeles
- AI describes products you don't actually offer
- AI mentions partnerships that don't exist
- AI gives outdated information (old pricing, discontinued products)

Hallucinations matter because:
- Users trust AI responses and may believe false information
- Incorrect information can damage your reputation
- It can lead to lost sales or confused customers

Preventing hallucinations:
- Ensure accurate information across all web sources
- Get listed in trusted databases like Wikidata
- Keep your website and business listings up to date`,
    examples: [
      "ChatGPT says your restaurant is vegan-only when it serves meat dishes",
      'Claude lists a product feature you removed two years ago',
    ],
    relatedTerms: ['Knowledge Graph', 'E-E-A-T'],
    icon: '⚠️',
  },
  {
    id: 'knowledge-graph',
    term: 'Knowledge Graph',
    category: 'core',
    shortDefinition: 'Trusted databases like Wikidata that AI models rely on.',
    fullDefinition: `A Knowledge Graph is a structured database of facts that AI models use as trusted sources of information. The most important knowledge graphs include:

- **Wikidata**: The structured data behind Wikipedia
- **Google Knowledge Graph**: Powers Google's knowledge panels
- **DBpedia**: Academic database of structured information

Why Knowledge Graphs matter for AI perception:
- AI models prioritize information from these trusted sources
- Being in a Knowledge Graph reduces hallucinations about your brand
- It establishes your brand as a recognized entity
- Information in Knowledge Graphs gets cited accurately

Getting into Knowledge Graphs:
- Create or improve your Wikipedia article
- Add your company to Wikidata with accurate information
- Ensure consistency across all official sources
- Use Schema.org markup on your website`,
    examples: [
      'A Wikidata entry with your founding date, location, and industry',
      'Being in Google Knowledge Graph shows a knowledge panel for your brand',
    ],
    relatedTerms: ['Hallucination', 'GEO', 'E-E-A-T'],
    icon: '🔗',
  },
];

// ================================================================
// METRICS & SCORING (8 terms)
// ================================================================

const METRICS_TERMS: GlossaryTerm[] = [
  {
    id: 'visibility-score',
    term: 'Visibility Score',
    category: 'metrics',
    shortDefinition: 'How often your brand appears in AI responses.',
    fullDefinition: `The Visibility Score measures the frequency with which AI models mention your brand when answering questions about your industry or niche.

It's calculated based on:
- Mention rate across different query types
- Prominence of mentions (featured vs. passing reference)
- Consistency across different AI providers
- Coverage across different use cases and intents`,
    examples: [
      'High visibility: mentioned in 8 out of 10 relevant queries',
      'Low visibility: only mentioned in 1 out of 10 queries',
    ],
    relatedTerms: ['AI Perception Score', 'Share of Voice'],
    icon: '👁️',
  },
  {
    id: 'sentiment-score',
    term: 'Sentiment Score',
    category: 'metrics',
    shortDefinition: 'Whether AI describes your brand positively or negatively.',
    fullDefinition: `The Sentiment Score analyzes the tone and emotional valence of how AI models describe your brand. It ranges from very negative (-1) to very positive (+1).

Key factors:
- Positive adjectives and recommendations
- Negative caveats or warnings
- Neutral factual statements
- Comparison with competitors

Sentiment categories:
- Very Positive (0.6+): Strong recommendations, enthusiastic language
- Positive (0.2-0.6): Generally favorable mentions
- Neutral (-0.2 to 0.2): Factual, balanced descriptions
- Negative (-0.6 to -0.2): Criticisms or concerns mentioned
- Very Negative (below -0.6): Strong warnings or negative associations`,
    examples: [
      '"Highly recommended for small businesses" = positive sentiment',
      '"Has had some reliability issues" = negative sentiment',
    ],
    relatedTerms: ['AI Perception Score', 'Authority Score'],
    icon: '😊',
  },
  {
    id: 'authority-score',
    term: 'Authority Score',
    category: 'metrics',
    shortDefinition: 'How credible AI considers your brand in your industry.',
    fullDefinition: `The Authority Score measures how much credibility and expertise AI models attribute to your brand within your industry.

Authority signals include:
- Being cited as an industry leader or pioneer
- Mentioned alongside established competitors
- Referenced for expertise or innovation
- Recommended for specialized use cases

Building authority:
- Thought leadership content
- Industry awards and recognition
- Expert citations and testimonials
- Original research and data`,
    examples: [
      '"One of the leading platforms in the space" = high authority',
      '"A newer player in the market" = developing authority',
    ],
    relatedTerms: ['E-E-A-T', 'AI Perception Score'],
    icon: '🏆',
  },
  {
    id: 'relevance-score',
    term: 'Relevance Score',
    category: 'metrics',
    shortDefinition: 'How well your brand matches user query intent.',
    fullDefinition: `The Relevance Score measures how appropriately AI matches your brand to specific user queries and intents.

High relevance means:
- AI recommends you for the right use cases
- Your features are accurately matched to user needs
- You're not suggested for irrelevant queries
- AI understands your target market

Relevance factors:
- Product/service category accuracy
- Target audience matching
- Use case alignment
- Feature set accuracy`,
    examples: [
      'Recommended for enterprise when you focus on SMB = low relevance',
      'Accurately suggested for your actual specialty = high relevance',
    ],
    relatedTerms: ['AI Perception Score', 'Visibility Score'],
    icon: '🎪',
  },
  {
    id: 'competitive-score',
    term: 'Competitive Score',
    category: 'metrics',
    shortDefinition: 'How you rank against competitors in AI responses.',
    fullDefinition: `The Competitive Score analyzes your position relative to competitors when AI makes recommendations.

Competitive factors:
- First mention vs. last mention in lists
- Featured recommendation vs. "also consider"
- Direct comparisons favorable vs. unfavorable
- Category leadership signals

Improving competitive position:
- Differentiate on unique features
- Build stronger authority signals
- Ensure accurate competitive positioning
- Address any incorrect comparisons`,
    examples: [
      '"The best option for X is [Competitor], but [You] is also good" = lower competitive score',
      '"[You] is the leading solution, ahead of [Competitor]" = higher competitive score',
    ],
    relatedTerms: ['Share of Voice', 'Authority Score'],
    icon: '⚔️',
  },
  {
    id: 'coverage-score',
    term: 'Coverage Score',
    category: 'metrics',
    shortDefinition: 'How many different query types mention your brand.',
    fullDefinition: `The Coverage Score measures the breadth of queries where your brand appears across different intents, topics, and use cases.

Coverage dimensions:
- Query intent types (comparison, recommendation, review, etc.)
- Industry sub-categories
- Geographic variations
- Use case variations

Good coverage means:
- Appearing in feature comparison queries
- Being mentioned in "best of" lists
- Showing up for specific use cases
- Coverage across different AI providers`,
    examples: [
      'Only mentioned for pricing queries = narrow coverage',
      'Mentioned for features, pricing, support, and comparisons = broad coverage',
    ],
    relatedTerms: ['Visibility Score', 'AI Perception Score'],
    icon: '🗺️',
  },
  {
    id: 'recency-score',
    term: 'Recency Score',
    category: 'metrics',
    shortDefinition: 'How current the information AI has about your brand.',
    fullDefinition: `The Recency Score indicates whether AI models have up-to-date information about your brand or are using outdated data.

Recency issues:
- Old product information
- Discontinued features still mentioned
- Outdated pricing
- Previous company name or branding

Improving recency:
- Regular website updates
- Consistent information across sources
- Fresh press coverage
- Updated knowledge base entries`,
    examples: [
      'AI mentions a feature you launched last month = high recency',
      'AI describes your old pricing from 2 years ago = low recency',
    ],
    relatedTerms: ['Hallucination', 'Knowledge Graph'],
    icon: '📅',
  },
  {
    id: 'consistency-score',
    term: 'Consistency Score',
    category: 'metrics',
    shortDefinition: 'How uniformly AI describes your brand across queries.',
    fullDefinition: `The Consistency Score measures whether AI provides uniform, accurate information about your brand across different queries and contexts.

Inconsistency issues:
- Different descriptions in different queries
- Conflicting information between AI providers
- Varying feature lists
- Contradictory recommendations

Building consistency:
- Unified brand messaging
- Consistent information across web properties
- Single source of truth (Schema.org, Wikidata)
- Regular audits of AI responses`,
    examples: [
      'ChatGPT and Claude give the same description = high consistency',
      'One AI says you have a feature another says you dont = low consistency',
    ],
    relatedTerms: ['Knowledge Graph', 'E-E-A-T'],
    icon: '🔄',
  },
];

// ================================================================
// TECHNICAL SEO (6 terms)
// ================================================================

const TECHNICAL_TERMS: GlossaryTerm[] = [
  {
    id: 'schema-markup',
    term: 'Schema.org Markup',
    category: 'technical',
    shortDefinition: 'Structured data that helps AI understand your business.',
    fullDefinition: `Schema.org markup is a standardized vocabulary that helps search engines and AI models understand the content on your website.

Key schema types for GEO:
- Organization: Company name, logo, contact info
- Product: Features, pricing, reviews
- LocalBusiness: Location, hours, services
- Article: Author, date, topic
- FAQPage: Questions and answers

Benefits:
- Clearer entity understanding by AI
- Reduced hallucinations
- Better feature and product matching
- Enhanced knowledge panel data`,
    examples: [
      'Organization schema with your founding date and industry',
      'Product schema with pricing and feature lists',
    ],
    relatedTerms: ['Knowledge Graph', 'Entity SEO'],
    icon: '🏗️',
  },
  {
    id: 'entity-seo',
    term: 'Entity SEO',
    category: 'technical',
    shortDefinition: 'Optimizing your brand as a recognized entity for AI.',
    fullDefinition: `Entity SEO focuses on establishing your brand as a distinct, recognized entity that AI models can accurately identify and describe.

Entity signals:
- Consistent NAP (Name, Address, Phone)
- Schema.org Organization markup
- Wikidata/Wikipedia presence
- Google Business Profile
- Consistent branding across platforms

Entity relationships:
- Industry associations
- Founder/leadership connections
- Product/service offerings
- Competitor relationships`,
    examples: [
      'Your company appearing in Google Knowledge Panel',
      'AI correctly linking your CEO to your company',
    ],
    relatedTerms: ['Schema.org Markup', 'Knowledge Graph', 'E-E-A-T'],
    icon: '🎭',
  },
  {
    id: 'structured-data',
    term: 'Structured Data',
    category: 'technical',
    shortDefinition: 'Machine-readable format for your business information.',
    fullDefinition: `Structured data is information organized in a standardized, machine-readable format that AI models can easily parse and understand.

Types of structured data:
- JSON-LD (recommended by Google)
- Microdata
- RDFa
- Open Graph

Key structured data for AI:
- Business information (Organization)
- Products and services (Product, Service)
- Reviews and ratings (Review, AggregateRating)
- Content (Article, BlogPosting)
- FAQs (FAQPage)`,
    examples: [
      'JSON-LD script in your page header',
      'Product markup with prices and availability',
    ],
    relatedTerms: ['Schema.org Markup', 'Entity SEO'],
    icon: '📋',
  },
  {
    id: 'citations',
    term: 'Citations',
    category: 'technical',
    shortDefinition: 'References to your brand across the web.',
    fullDefinition: `Citations are mentions of your brand, products, or information across websites, publications, and databases that AI models reference when generating responses.

Citation sources:
- Industry publications and blogs
- Review sites (G2, Capterra, TrustPilot)
- News outlets and press releases
- Academic papers and research
- Wikipedia and other knowledge bases

Building citations:
- Digital PR and media outreach
- Guest posting and thought leadership
- Review generation campaigns
- Industry directory listings`,
    examples: [
      'Being mentioned in a Forbes article',
      'Listed in industry comparison guides',
    ],
    relatedTerms: ['Authority Score', 'E-E-A-T'],
    icon: '📰',
  },
  {
    id: 'brand-mentions',
    term: 'Brand Mentions',
    category: 'technical',
    shortDefinition: 'Unlinked references to your brand across the web.',
    fullDefinition: `Brand mentions are references to your company or products that appear online, even without hyperlinks. AI models analyze these mentions for authority and sentiment signals.

Types of mentions:
- Linked mentions (with hyperlink to your site)
- Unlinked mentions (text reference only)
- Social mentions (social media references)
- Forum mentions (Reddit, Quora, etc.)

Quality factors:
- Source authority
- Context and sentiment
- Frequency and recency
- Geographic relevance`,
    examples: [
      'Your company name appearing in a product comparison',
      'Users recommending you in Reddit discussions',
    ],
    relatedTerms: ['Citations', 'Authority Score'],
    icon: '💬',
  },
  {
    id: 'social-proof',
    term: 'Social Proof',
    category: 'technical',
    shortDefinition: 'Third-party validation that builds AI trust in your brand.',
    fullDefinition: `Social proof consists of external validation signals that help AI models determine your brand's trustworthiness and credibility.

Types of social proof:
- Customer reviews and ratings
- Case studies and testimonials
- User-generated content
- Social media engagement
- Industry awards and certifications

Impact on AI perception:
- Higher trust signals
- More confident recommendations
- Better sentiment analysis
- Stronger authority signals`,
    examples: [
      '4.8 star rating on G2 with 500+ reviews',
      'Featured case studies from recognizable brands',
    ],
    relatedTerms: ['E-E-A-T', 'Authority Score'],
    icon: '⭐',
  },
];

// ================================================================
// AI & NLP (8 terms)
// ================================================================

const AI_NLP_TERMS: GlossaryTerm[] = [
  {
    id: 'llm',
    term: 'LLM (Large Language Model)',
    category: 'ai-nlp',
    shortDefinition: 'The AI systems that power ChatGPT, Claude, and similar tools.',
    fullDefinition: `Large Language Models (LLMs) are AI systems trained on vast amounts of text data that can understand and generate human-like text.

Popular LLMs:
- OpenAI GPT-4 (powers ChatGPT)
- Anthropic Claude
- Google Gemini
- Meta LLaMA
- Perplexity

LLM characteristics:
- Pre-trained on web data (including your brand information)
- Can answer questions about products and services
- Generate recommendations based on training data
- May have outdated or incorrect information`,
    examples: [
      'ChatGPT using GPT-4 to recommend CRM software',
      'Claude analyzing product reviews to suggest options',
    ],
    relatedTerms: ['Hallucination', 'AI Perception Score'],
    icon: '🤖',
  },
  {
    id: 'training-data',
    term: 'Training Data',
    category: 'ai-nlp',
    shortDefinition: 'The information AI models learned from about your brand.',
    fullDefinition: `Training data is the corpus of text that AI models are trained on, which forms their knowledge base about your brand and industry.

Training data sources:
- Web pages and websites
- Wikipedia and knowledge bases
- News articles and publications
- Social media and forums
- Books and academic papers

Training data considerations:
- Data cutoff dates (AI may have outdated info)
- Source reliability and accuracy
- Coverage of your brand
- Competitor representation`,
    examples: [
      'AI learned about your product from your website and reviews',
      'Information from a 2022 article may still be in training data',
    ],
    relatedTerms: ['LLM', 'Recency Score'],
    icon: '📚',
  },
  {
    id: 'sentiment-analysis',
    term: 'Sentiment Analysis',
    category: 'ai-nlp',
    shortDefinition: 'AI technique for understanding positive/negative tone.',
    fullDefinition: `Sentiment analysis is an NLP technique that determines the emotional tone of text, classifying it as positive, negative, or neutral.

Sentiment signals:
- Word choice and adjectives
- Context and framing
- Comparative language
- Intensifiers and hedging

How we use it:
- Analyzing AI responses about your brand
- Detecting positive or negative recommendations
- Comparing sentiment across competitors
- Tracking sentiment changes over time`,
    examples: [
      '"Excellent customer service" = positive sentiment',
      '"There have been some concerns about..." = negative sentiment',
    ],
    relatedTerms: ['Sentiment Score', 'NLP'],
    icon: '🔬',
  },
  {
    id: 'nlp',
    term: 'NLP (Natural Language Processing)',
    category: 'ai-nlp',
    shortDefinition: 'AI technology for understanding and generating human language.',
    fullDefinition: `Natural Language Processing (NLP) is the field of AI focused on enabling computers to understand, interpret, and generate human language.

NLP capabilities:
- Text understanding and classification
- Named entity recognition
- Sentiment analysis
- Question answering
- Text generation

NLP in GEO:
- Understanding query intent
- Analyzing AI responses
- Detecting brand mentions
- Measuring sentiment and tone`,
    examples: [
      'AI understanding that "best project management tool" is asking for recommendations',
      'Extracting brand names from AI response text',
    ],
    relatedTerms: ['Sentiment Analysis', 'LLM'],
    icon: '🗣️',
  },
  {
    id: 'query-intent',
    term: 'Query Intent',
    category: 'ai-nlp',
    shortDefinition: 'What the user is trying to accomplish with their question.',
    fullDefinition: `Query intent refers to the underlying goal or purpose behind a user's question to an AI assistant.

Intent types:
- Recommendation: "What's the best X?"
- Comparison: "X vs Y"
- Evaluation: "Is X good for Y?"
- Alternatives: "Alternatives to X"
- Features: "Does X have Y feature?"
- Review: "What do people think of X?"

Why intent matters:
- Different intents trigger different responses
- Your brand may appear differently based on intent
- Some intents are more valuable (recommendations vs. general info)
- Coverage across intents indicates comprehensive visibility`,
    examples: [
      '"Best CRM for startups" = recommendation intent',
      '"Salesforce vs HubSpot" = comparison intent',
    ],
    relatedTerms: ['Coverage Score', 'Visibility Score'],
    icon: '🎯',
  },
  {
    id: 'named-entity-recognition',
    term: 'Named Entity Recognition (NER)',
    category: 'ai-nlp',
    shortDefinition: 'AI identifying your brand name in text.',
    fullDefinition: `Named Entity Recognition (NER) is an NLP technique that identifies and classifies named entities in text, such as companies, products, people, and locations.

Entity types:
- Organizations (companies, brands)
- Products (software, physical products)
- People (founders, executives)
- Locations (headquarters, service areas)
- Events (conferences, launches)

NER in GEO:
- Detecting your brand in AI responses
- Identifying competitor mentions
- Tracking entity relationships
- Measuring mention frequency`,
    examples: [
      'Recognizing "Stripe" as a company in a payments discussion',
      'Identifying "Slack" as both a company and a product',
    ],
    relatedTerms: ['Entity SEO', 'NLP'],
    icon: '🏷️',
  },
  {
    id: 'hedging',
    term: 'Hedging Language',
    category: 'ai-nlp',
    shortDefinition: 'Uncertain or cautious language AI uses about brands.',
    fullDefinition: `Hedging language refers to words and phrases that express uncertainty, qualification, or caution in AI responses about your brand.

Hedging indicators:
- "might", "may", "could", "possibly"
- "some users report", "in some cases"
- "it depends on", "generally"
- "considered by many to be"

Why hedging matters:
- Strong hedging indicates AI uncertainty about your brand
- Less hedging suggests confidence in recommendations
- Hedging can reduce the strength of endorsements
- May indicate need for better information sources`,
    examples: [
      '"Might be a good option" (hedged) vs "Is an excellent choice" (confident)',
      '"Some say it has issues" (hedged negative)',
    ],
    relatedTerms: ['Sentiment Score', 'Authority Score'],
    icon: '❓',
  },
  {
    id: 'prompt-engineering',
    term: 'Prompt Engineering',
    category: 'ai-nlp',
    shortDefinition: 'Crafting AI queries to get optimal brand analysis.',
    fullDefinition: `Prompt engineering is the practice of designing and optimizing the queries sent to AI models to get the most useful and accurate responses.

Prompt considerations:
- Query structure and phrasing
- Context and constraints
- Output format specifications
- Persona and perspective

In AI perception analysis:
- Simulating real user queries
- Testing different phrasings
- Analyzing edge cases
- Benchmarking across providers`,
    examples: [
      'Testing "best X" vs "recommend X" vs "top X" phrasings',
      'Including context like "for a small business"',
    ],
    relatedTerms: ['Query Intent', 'LLM'],
    icon: '✍️',
  },
];

// ================================================================
// BUSINESS & STRATEGY (6 terms)
// ================================================================

const BUSINESS_TERMS: GlossaryTerm[] = [
  {
    id: 'ai-visibility-strategy',
    term: 'AI Visibility Strategy',
    category: 'business',
    shortDefinition: 'Your plan for improving AI recommendations of your brand.',
    fullDefinition: `An AI Visibility Strategy is a comprehensive plan for improving how AI models perceive, describe, and recommend your brand.

Strategy components:
- Current state assessment (AI Perception Score)
- Competitor analysis
- Gap identification
- Prioritized recommendations
- Implementation roadmap
- Success metrics

Key focus areas:
- Information accuracy across sources
- Authority signal building
- Content optimization for AI
- Knowledge graph presence
- Review and social proof`,
    examples: [
      'Q1 focus on Schema.org implementation',
      'Building Wikipedia presence over 6 months',
    ],
    relatedTerms: ['GEO', 'AI Perception Score'],
    icon: '📈',
  },
  {
    id: 'ai-driven-discovery',
    term: 'AI-Driven Discovery',
    category: 'business',
    shortDefinition: 'Users finding your brand through AI recommendations.',
    fullDefinition: `AI-Driven Discovery refers to the process of potential customers discovering your brand through recommendations from AI assistants like ChatGPT and Claude.

Discovery channels:
- AI assistants (ChatGPT, Claude, Gemini)
- AI-powered search (Perplexity, Bing AI)
- Voice assistants (Alexa, Siri, Google)
- AI-enhanced product search

Impact on business:
- Growing source of qualified leads
- Often higher intent users
- Different from traditional search
- Requires new optimization approaches`,
    examples: [
      'User asks ChatGPT for CRM recommendations, discovers your product',
      'Perplexity includes your tool in a comparison query',
    ],
    relatedTerms: ['Share of Voice', 'GEO'],
    icon: '🔍',
  },
  {
    id: 'competitive-intelligence',
    term: 'Competitive Intelligence',
    category: 'business',
    shortDefinition: 'Understanding how AI positions you vs. competitors.',
    fullDefinition: `Competitive Intelligence in AI perception involves understanding how AI models compare, contrast, and rank your brand against competitors.

Intelligence areas:
- Relative visibility (Share of Voice)
- Comparative sentiment
- Feature comparisons AI makes
- Positioning and differentiation
- Recommendation patterns

Strategic applications:
- Identifying competitive gaps
- Finding differentiation opportunities
- Monitoring competitor changes
- Adjusting positioning strategy`,
    examples: [
      'AI consistently mentions competitor feature you also have',
      'Competitor appears more often for your target use case',
    ],
    relatedTerms: ['Share of Voice', 'Competitive Score'],
    icon: '🕵️',
  },
  {
    id: 'quick-wins',
    term: 'Quick Wins',
    category: 'business',
    shortDefinition: 'High-impact improvements you can make immediately.',
    fullDefinition: `Quick Wins are GEO optimizations that can be implemented quickly with significant impact on your AI perception.

Common quick wins:
- Adding Schema.org markup
- Fixing inconsistent business information
- Updating outdated content
- Adding FAQ sections
- Claiming business profiles

Quick win characteristics:
- Low implementation effort
- Fast time to impact
- Clear ROI
- Minimal dependencies
- Measurable results`,
    examples: [
      'Adding Organization schema takes 30 minutes, improves entity recognition',
      'Updating pricing page removes source of hallucinations',
    ],
    relatedTerms: ['GEO', 'AI Perception Score'],
    icon: '⚡',
  },
  {
    id: 'perception-audit',
    term: 'Perception Audit',
    category: 'business',
    shortDefinition: 'Comprehensive analysis of how AI sees your brand.',
    fullDefinition: `A Perception Audit is a thorough analysis of how various AI models perceive, describe, and recommend your brand across different query types and contexts.

Audit components:
- Query testing across providers
- Score calculation and breakdown
- Competitor benchmarking
- Hallucination detection
- Opportunity identification
- Prioritized recommendations

Audit outputs:
- Overall AI Perception Score
- Category score breakdown
- Competitive position analysis
- Specific improvement recommendations
- Priority-ranked action items`,
    examples: [
      'Testing 50 queries across ChatGPT, Claude, and Perplexity',
      'Identifying 3 hallucinations and 5 optimization opportunities',
    ],
    relatedTerms: ['AI Perception Score', 'GEO'],
    icon: '🔎',
  },
  {
    id: 'roi-of-geo',
    term: 'ROI of GEO',
    category: 'business',
    shortDefinition: 'Measuring the business value of AI visibility improvements.',
    fullDefinition: `ROI of GEO measures the return on investment from optimizing your brand's AI visibility and perception.

ROI metrics:
- Increase in AI-driven traffic
- Lead quality from AI referrals
- Brand awareness lift
- Reduced customer confusion
- Competitive position improvement

Measurement approaches:
- AI referral tracking
- Before/after score comparison
- Lead source attribution
- Customer survey data
- Share of Voice changes`,
    examples: [
      '20% increase in AI Perception Score correlates with 15% more AI-driven leads',
      'Fixing hallucinations reduced support tickets about incorrect info by 30%',
    ],
    relatedTerms: ['AI Visibility Strategy', 'AI Perception Score'],
    icon: '💰',
  },
];

// ================================================================
// ALL TERMS
// ================================================================

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  ...CORE_TERMS,
  ...METRICS_TERMS,
  ...TECHNICAL_TERMS,
  ...AI_NLP_TERMS,
  ...BUSINESS_TERMS,
];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get terms by category
 */
export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((term) => term.category === category);
}

/**
 * Get a single term by ID
 */
export function getTermById(id: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((term) => term.id === id);
}

/**
 * Search terms by keyword
 */
export function searchTerms(query: string): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();
  return GLOSSARY_TERMS.filter(
    (term) =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.shortDefinition.toLowerCase().includes(lowerQuery) ||
      term.fullDefinition.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get related terms for a given term
 */
export function getRelatedTerms(termId: string): GlossaryTerm[] {
  const term = getTermById(termId);
  if (!term || !term.relatedTerms) return [];

  return term.relatedTerms
    .map((related) => {
      return GLOSSARY_TERMS.find(
        (t) =>
          t.term.toLowerCase().includes(related.toLowerCase()) ||
          related.toLowerCase().includes(t.term.toLowerCase().split(' ')[0])
      );
    })
    .filter((t): t is GlossaryTerm => t !== undefined);
}

/**
 * Get all categories with their terms
 */
export function getCategorizedTerms(): Record<GlossaryCategory, GlossaryTerm[]> {
  return {
    core: CORE_TERMS,
    metrics: METRICS_TERMS,
    technical: TECHNICAL_TERMS,
    'ai-nlp': AI_NLP_TERMS,
    business: BUSINESS_TERMS,
  };
}

/**
 * Get term count by category
 */
export function getTermCountByCategory(): Record<GlossaryCategory, number> {
  return {
    core: CORE_TERMS.length,
    metrics: METRICS_TERMS.length,
    technical: TECHNICAL_TERMS.length,
    'ai-nlp': AI_NLP_TERMS.length,
    business: BUSINESS_TERMS.length,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  GLOSSARY_TERMS,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getTermsByCategory,
  getTermById,
  searchTerms,
  getRelatedTerms,
  getCategorizedTerms,
  getTermCountByCategory,
};
