/**
 * Individual Help Article Page
 *
 * Phase 2, Week 3, Day 5
 * Dynamic help article pages with full content
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ================================================================
// ARTICLE CONTENT
// ================================================================

interface ArticleContent {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  lastUpdated: string;
  content: string;
  relatedArticles: string[];
}

const articleContents: Record<string, ArticleContent> = {
  'understanding-ai-perception': {
    id: 'understanding-ai-perception',
    title: 'Understanding AI Perception',
    description: 'Learn what AI perception is and why it matters for your brand.',
    category: 'Getting Started',
    readTime: '5 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['how-scoring-works', 'first-analysis'],
    content: `
## What is AI Perception?

AI Perception refers to how artificial intelligence systems understand, represent, and recommend your brand when users interact with them. As AI assistants like ChatGPT, Claude, and Google Gemini become primary information sources for millions of users, how they perceive your brand directly impacts your business.

## Why Does It Matter?

### The Shift in Search Behavior

Traditional search engines return lists of links for users to explore. AI assistants, however, provide direct answers and recommendations. When someone asks "What's the best CRM for small businesses?" or "Which project management tool should I use?", the AI doesn't just list options—it makes recommendations based on its understanding of each brand.

### Key Impact Areas

1. **Discovery**: If AI models don't know about your brand, they can't recommend it
2. **Accuracy**: Incorrect information in AI responses damages trust
3. **Sentiment**: Negative AI perception can spread misinformation
4. **Competitive Position**: How you compare to competitors in AI responses matters

## How AI Models Learn About Brands

AI systems are trained on vast amounts of internet data, including:

- **Wikipedia** and knowledge bases
- **News articles** and press releases
- **Official websites** and documentation
- **Review platforms** (G2, Trustpilot, etc.)
- **Social media** and forums
- **Structured data** (Schema.org markup)
- **Academic papers** and industry reports

The quality, quantity, and recency of this information directly affects how AI perceives your brand.

## The AI Perception Gap

Many brands have a significant gap between:
- How they want to be perceived
- How they actually appear in AI responses

This gap can result from:
- Outdated information in training data
- Lack of authoritative citations
- Competitor dominance in relevant queries
- Missing structured data
- Poor sentiment from reviews

## Taking Control of Your AI Perception

Unlike traditional SEO where you optimize for algorithms, AI perception optimization requires a multi-faceted approach:

1. **Structured Data**: Help AI understand your brand entity
2. **Authoritative Content**: Create citable, expert content
3. **Citation Building**: Get mentioned in sources AI trusts
4. **Review Management**: Build positive social proof
5. **Competitor Monitoring**: Track competitive positioning

## Next Steps

Ready to improve your AI perception? Start with:
1. [Running your first analysis](/help/first-analysis)
2. [Understanding your score](/help/how-scoring-works)
3. [Implementing quick wins](/help/schema-markup-guide)
    `,
  },

  'how-scoring-works': {
    id: 'how-scoring-works',
    title: 'How the AI Perception Score Works',
    description: 'A detailed breakdown of our scoring methodology.',
    category: 'Getting Started',
    readTime: '8 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['interpreting-results', 'understanding-ai-perception'],
    content: `
## The AI Perception Score

Your AI Perception Score is a 0-100 metric that quantifies how well AI systems understand and represent your brand. Higher scores indicate better AI visibility and more accurate representation.

## Score Components

### 1. Visibility (25%)
Measures how often your brand appears in AI responses for relevant queries.

- **High visibility**: Brand mentioned in 70%+ of relevant queries
- **Medium visibility**: Brand mentioned in 40-70% of relevant queries
- **Low visibility**: Brand mentioned in less than 40% of relevant queries

### 2. Accuracy (25%)
Evaluates whether AI-provided information about your brand is correct.

- Company facts (founding date, location, size)
- Product/service descriptions
- Pricing information
- Leadership and key people

### 3. Sentiment (20%)
Analyzes the tone and context of how AI describes your brand.

- Positive: Recommended, praised, highlighted as leader
- Neutral: Mentioned factually without strong opinions
- Negative: Associated with problems, complaints, or warnings

### 4. Authority (15%)
Measures trust signals that AI models recognize.

- Citation in authoritative sources
- E-E-A-T signals (Experience, Expertise, Authority, Trust)
- Industry awards and certifications
- Expert endorsements

### 5. Competitive Position (15%)
Compares your brand perception against competitors.

- Share of voice in category queries
- Recommendation likelihood vs. competitors
- Feature comparison accuracy

## Score Grades

| Score Range | Grade | Meaning |
|-------------|-------|---------|
| 90-100 | Excellent | Industry-leading AI presence |
| 75-89 | Good | Strong visibility with minor gaps |
| 60-74 | Average | Room for significant improvement |
| 40-59 | Poor | Urgent optimization needed |
| 0-39 | Critical | Serious AI perception issues |

## Provider-Specific Scores

We analyze your brand across multiple AI platforms:

- **OpenAI GPT-4**: The most widely used AI assistant
- **Anthropic Claude**: Growing rapidly in enterprise
- **Google Gemini**: Integrated with Google Search
- **Perplexity AI**: Popular for research queries

Each provider may have different perceptions based on their training data and methods.

## How Scores Are Calculated

1. **Query Generation**: We identify relevant queries for your brand
2. **Response Collection**: Gather AI responses across providers
3. **Analysis**: NLP analysis of mentions, sentiment, accuracy
4. **Normalization**: Scores adjusted for industry benchmarks
5. **Aggregation**: Component scores combined with weights

## Improving Your Score

Focus on areas with the lowest sub-scores first. Common improvement strategies:

- **Low Visibility**: Increase authoritative mentions and citations
- **Low Accuracy**: Update official sources with correct information
- **Low Sentiment**: Address negative reviews and build positive proof
- **Low Authority**: Build E-E-A-T signals and expert content
- **Low Competitive**: Create differentiation content
    `,
  },

  'first-analysis': {
    id: 'first-analysis',
    title: 'Running Your First Analysis',
    description: 'Step-by-step guide to analyzing your brand.',
    category: 'Getting Started',
    readTime: '4 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['interpreting-results', 'how-scoring-works'],
    content: `
## Getting Started with Your First Analysis

Analyzing your brand's AI perception is simple and takes just a few minutes.

## Step 1: Enter Your Brand URL

On the homepage, enter your brand's primary website URL. This should be:
- Your main company website (e.g., example.com)
- Not a specific page URL
- The domain you want AI to associate with your brand

## Step 2: Provide Brand Details

For the most accurate analysis, provide:
- **Brand Name**: Your official company/product name
- **Industry**: Select from our list or describe your category
- **Competitors** (optional): Names of main competitors

## Step 3: Wait for Analysis

Our system will:
1. Query multiple AI providers about your brand
2. Analyze responses for mentions, accuracy, and sentiment
3. Calculate your AI Perception Score
4. Generate actionable recommendations

This typically takes 30-60 seconds.

## Step 4: Review Your Results

Your results page includes:

### Overall Score
Your aggregate AI Perception Score (0-100)

### Provider Breakdown
How each AI platform perceives your brand

### Category Scores
Detailed scores for visibility, accuracy, sentiment, authority, and competitive position

### Recommendations
Prioritized actions to improve your score

## Understanding Your First Results

Don't be discouraged by a low initial score—most brands have significant room for improvement. Focus on:

1. **Quick Wins**: Look for recommendations marked as high-impact, low-effort
2. **Critical Issues**: Address any accuracy problems first
3. **Biggest Gaps**: Target your lowest-scoring categories

## Next Steps After Your First Analysis

1. **Save your report**: Results are available for 30 days
2. **Review recommendations**: Prioritize based on your resources
3. **Start with Schema**: [Implement structured data](/help/schema-markup-guide)
4. **Set a baseline**: Run weekly analyses to track progress
5. **Share with team**: Export report for stakeholders
    `,
  },

  'schema-markup-guide': {
    id: 'schema-markup-guide',
    title: 'Complete Schema Markup Guide',
    description: 'Learn how to implement structured data for AI.',
    category: 'Optimization',
    readTime: '12 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['content-optimization', 'building-authority'],
    content: `
## Why Schema Markup Matters for AI

Schema markup (structured data) helps AI systems understand your brand as an entity, not just a collection of web pages. Proper implementation can significantly improve how AI assistants describe and recommend your brand.

## Essential Schema Types

### 1. Organization Schema

Add to your homepage:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourcompany.com",
  "logo": "https://yourcompany.com/logo.png",
  "description": "Brief company description",
  "foundingDate": "2020",
  "founders": [{
    "@type": "Person",
    "name": "Founder Name"
  }],
  "sameAs": [
    "https://twitter.com/yourcompany",
    "https://linkedin.com/company/yourcompany",
    "https://facebook.com/yourcompany"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-555-5555",
    "contactType": "customer service"
  }
}
\`\`\`

### 2. Product/Service Schema

Add to product pages:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "brand": {
    "@type": "Brand",
    "name": "Your Brand"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.00",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "150"
  }
}
\`\`\`

### 3. FAQ Schema

Add to FAQ pages:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What does your product do?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Our product helps you..."
    }
  }]
}
\`\`\`

### 4. Article Schema

Add to blog posts:

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-20"
}
\`\`\`

## Implementation Methods

### Method 1: JSON-LD (Recommended)
Add a \`<script type="application/ld+json">\` tag in your page's \`<head>\`

### Method 2: Next.js/React
Use the built-in \`next/head\` or a component to inject JSON-LD

### Method 3: CMS Plugins
- WordPress: Yoast SEO, Rank Math
- Shopify: JSON-LD for SEO app
- Webflow: Custom code embed

## Testing Your Schema

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema Validator**: https://validator.schema.org/
3. **Browser DevTools**: Check for JSON-LD scripts in page source

## Best Practices

1. **Be Accurate**: Only include verified information
2. **Stay Updated**: Update schema when information changes
3. **Be Comprehensive**: Include all relevant entity types
4. **Use sameAs**: Link to all official profiles
5. **Test Regularly**: Validate after any site changes
    `,
  },

  'content-optimization': {
    id: 'content-optimization',
    title: 'Optimizing Content for AI',
    description: 'Best practices for AI-friendly content.',
    category: 'Optimization',
    readTime: '10 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['schema-markup-guide', 'building-authority'],
    content: `
## Creating AI-Optimized Content

Content that performs well with AI assistants follows specific patterns. Here's how to optimize your content for AI discovery and recommendation.

## 1. Clear, Authoritative Answers

AI systems look for content that directly answers questions. Structure your content with:

- **Clear headings** that match common queries
- **Direct answers** in the first paragraph
- **Supporting detail** in subsequent paragraphs
- **Summaries** for key takeaways

## 2. Factual, Citable Information

AI models prefer content they can confidently cite:

- Include **specific statistics** with sources
- Provide **dates and version numbers**
- Reference **official sources**
- Keep information **current and updated**

## 3. Entity-Rich Content

Help AI understand the entities in your content:

- **Name your brand consistently** across all content
- **Mention relevant industry terms**
- **Link to authoritative sources**
- **Use proper nouns** for people, companies, products

## 4. Comprehensive Coverage

AI favors comprehensive resources:

- Create **pillar content** on core topics
- Cover topics **thoroughly** (2000+ words for key topics)
- Include **multiple perspectives**
- Address **related questions**

## 5. Structured Formatting

Help AI parse your content:

- Use **descriptive headings** (H2, H3)
- Create **bulleted lists** for features/benefits
- Add **tables** for comparisons
- Include **FAQ sections**

## 6. E-E-A-T Signals

Build expertise, experience, authoritativeness, and trust:

- **Author bylines** with credentials
- **About pages** with company history
- **Expert sources** and citations
- **Updated dates** on all content

## Content Types That AI Loves

### Comparison Pages
"Product A vs Product B" content is frequently cited in AI responses.

### How-To Guides
Step-by-step instructions are valuable for AI assistants.

### Glossary/Definition Pages
AI often references these for terminology questions.

### Case Studies
Concrete examples with results are highly citable.

### FAQ Pages
Direct Q&A format matches how users query AI.

## Content Refresh Strategy

AI training data has a cutoff date. Keep content fresh:

1. **Audit quarterly**: Review top pages for accuracy
2. **Update statistics**: Refresh data annually
3. **Add new information**: Keep content current
4. **Re-publish updates**: Update the publish date when significant changes are made
    `,
  },

  'building-authority': {
    id: 'building-authority',
    title: 'Building Authority Signals',
    description: 'Strategies for establishing brand authority.',
    category: 'Optimization',
    readTime: '8 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['content-optimization', 'schema-markup-guide'],
    content: `
## Why Authority Matters for AI Perception

AI models evaluate the trustworthiness of information sources. Brands with strong authority signals are more likely to be recommended and cited accurately.

## Key Authority Signals

### 1. Expert Contributors

- Feature content from recognized industry experts
- Include detailed author bios with credentials
- Link to external profiles (LinkedIn, academic pages)
- Use Person schema markup

### 2. Third-Party Validation

- Industry awards and certifications
- Press mentions in reputable publications
- Customer testimonials from known brands
- Partnership badges and affiliations

### 3. Citation Building

- Get mentioned in Wikipedia (where eligible)
- Contribute to industry publications
- Publish research that others cite
- Build backlinks from authoritative sites

### 4. Social Proof

- Customer reviews on trusted platforms
- Case studies with measurable results
- User testimonials with attribution
- Trust badges and security certifications

## Building E-E-A-T

### Experience
Show real-world experience with your product/service:
- Customer success stories
- Behind-the-scenes content
- Product development insights

### Expertise
Demonstrate deep knowledge:
- Technical documentation
- Educational content
- Expert commentary

### Authoritativeness
Establish your position in the industry:
- Speaking engagements
- Industry awards
- Media mentions

### Trustworthiness
Build user confidence:
- Transparent policies
- Security certifications
- Contact information
- Privacy practices

## Authority Building Tactics

### Short-term (1-3 months)
1. Complete all review platform profiles
2. Add author bios to all content
3. Implement Organization schema
4. Display trust badges prominently

### Medium-term (3-6 months)
1. Launch thought leadership content
2. Pursue industry certifications
3. Build media relationships
4. Contribute to industry publications

### Long-term (6-12 months)
1. Conduct original research
2. Establish Wikipedia presence
3. Secure speaking engagements
4. Build expert contributor network
    `,
  },

  'interpreting-results': {
    id: 'interpreting-results',
    title: 'Interpreting Your Results',
    description: 'How to read and understand your analysis report.',
    category: 'Analysis',
    readTime: '6 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['how-scoring-works', 'competitor-analysis'],
    content: `
## Understanding Your AI Perception Report

Your analysis report contains valuable insights. Here's how to interpret each section effectively.

## The Overall Score

Your overall score (0-100) represents your aggregate AI perception across all factors. Use this as a benchmark, but dig into the details for actionable insights.

### Score Context
- Compare to your industry average
- Track changes over time
- Don't obsess over small fluctuations

## Provider Breakdown

Each AI provider may perceive your brand differently:

### OpenAI GPT
- Largest user base
- Prioritize if it's your lowest score
- Updates training data periodically

### Anthropic Claude
- Growing enterprise adoption
- Often more cautious in recommendations
- Values safety and accuracy

### Google Gemini
- Integrated with Google Search
- May reflect search rankings
- Important for discoverability

### Perplexity
- Popular for research queries
- Cites sources explicitly
- Good for citation tracking

## Category Deep Dives

### Visibility Score
- Low: Focus on citation building
- Medium: Expand content presence
- High: Maintain and protect position

### Accuracy Score
- Issues: Update official sources immediately
- Moderate: Create authoritative content
- High: Monitor for changes

### Sentiment Score
- Negative: Address root causes, build positive proof
- Neutral: Create differentiation
- Positive: Leverage in marketing

### Authority Score
- Low: Build E-E-A-T signals
- Medium: Expand expert content
- High: Maintain thought leadership

### Competitive Score
- Low: Create comparison content
- Medium: Highlight differentiators
- High: Monitor competitor moves

## Recommendations Priority

Recommendations are ranked by:
1. **Impact**: Potential score improvement
2. **Effort**: Resources required
3. **Urgency**: Time sensitivity

Start with high-impact, low-effort items (quick wins).

## Key Metrics to Track

1. **Score trend**: Direction matters more than absolute number
2. **Provider consistency**: Large gaps indicate issues
3. **Category balance**: Avoid having any critically low areas
4. **Recommendation completion**: Track implementation progress
    `,
  },

  'competitor-analysis': {
    id: 'competitor-analysis',
    title: 'Analyzing Competitors',
    description: 'Use competitive insights to improve positioning.',
    category: 'Analysis',
    readTime: '7 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['interpreting-results', 'ai-provider-differences'],
    content: `
## Competitive AI Perception Analysis

Understanding how competitors are perceived by AI systems reveals opportunities to differentiate and improve your positioning.

## Why Competitive Analysis Matters

AI assistants frequently compare brands:
- "What's the difference between X and Y?"
- "Which is better, X or Y?"
- "Alternatives to X"

Your positioning in these comparisons directly impacts recommendation likelihood.

## What to Analyze

### Share of Voice
How often each competitor is mentioned in relevant queries:
- Track mentions across query types
- Monitor changes over time
- Identify dominant players

### Sentiment Comparison
How positively/negatively AI describes each brand:
- Compare recommendation language
- Note specific praise or criticism
- Identify sentiment drivers

### Feature Attribution
Which features/benefits AI associates with each brand:
- Track unique differentiators
- Identify gaps in your coverage
- Note competitive advantages

### Positioning Gaps
Where competitors are weak or absent:
- Find underserved use cases
- Identify missed keywords
- Discover niche opportunities

## Competitive Intelligence Tactics

### 1. Query Mining
Run queries that would mention competitors:
- "[Competitor] alternatives"
- "[Competitor] vs"
- "Best [category] tools"

### 2. Response Analysis
For each competitor, note:
- How often they're mentioned
- In what context
- With what sentiment
- Which features highlighted

### 3. Gap Identification
Find opportunities where:
- Competitors are weak
- Category is underserved
- Your strengths aren't recognized

## Competitive Strategies

### When Behind Market Leaders
- Focus on specific use cases
- Target underserved segments
- Emphasize unique differentiators
- Build concentrated authority

### When Leading
- Maintain citation presence
- Address emerging competitors
- Expand into adjacent topics
- Protect key positions

### When Evenly Matched
- Create head-to-head content
- Highlight honest comparisons
- Build distinctive positioning
- Focus on sentiment
    `,
  },

  'ai-provider-differences': {
    id: 'ai-provider-differences',
    title: 'AI Provider Differences',
    description: 'Understanding how different AI platforms perceive brands.',
    category: 'Advanced',
    readTime: '10 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['interpreting-results', 'competitor-analysis'],
    content: `
## How Different AI Systems Perceive Brands

Each major AI platform has unique characteristics that affect how they understand and recommend brands.

## OpenAI (ChatGPT, GPT-4)

### Characteristics
- Largest user base
- Regular training updates
- Broad knowledge coverage
- Generally balanced recommendations

### Optimization Focus
- Ensure presence in commonly cited sources
- Focus on comprehensive, authoritative content
- Monitor for accuracy issues

### Known Behaviors
- Often provides multiple options
- May be cautious about specific recommendations
- Values recent, high-quality sources

## Anthropic (Claude)

### Characteristics
- Growing enterprise adoption
- Emphasis on safety and accuracy
- More conservative recommendations
- Strong reasoning capabilities

### Optimization Focus
- Build strong authority signals
- Ensure factual accuracy
- Create balanced, nuanced content

### Known Behaviors
- More likely to caveat recommendations
- Values transparency and honesty
- May avoid controversial claims

## Google (Gemini)

### Characteristics
- Integrated with Google Search
- Access to fresh web data
- Strong local awareness
- Multimodal capabilities

### Optimization Focus
- Traditional SEO remains important
- Structured data critical
- Local optimization matters

### Known Behaviors
- May reflect search rankings
- Strong for factual queries
- Good at citing sources

## Perplexity AI

### Characteristics
- Research-focused
- Explicit source citation
- Real-time web access
- Academic style responses

### Optimization Focus
- Build citable content
- Ensure source presence
- Create research-worthy material

### Known Behaviors
- Always cites sources
- Good for tracking citations
- Values recent information

## Cross-Platform Optimization

### Universal Best Practices
1. Maintain consistent brand information everywhere
2. Build citations in sources all platforms trust
3. Create comprehensive, authoritative content
4. Use structured data consistently
5. Monitor all platforms regularly

### Platform-Specific Tactics
- ChatGPT: Focus on Wikipedia, major news
- Claude: Emphasize accuracy, expert sources
- Gemini: Optimize for Google Search
- Perplexity: Build citable research

### Handling Inconsistencies
When platforms disagree:
1. Identify the source of disagreement
2. Create authoritative correction content
3. Update official sources
4. Monitor for convergence
    `,
  },

  'crisis-management': {
    id: 'crisis-management',
    title: 'AI Reputation Crisis Management',
    description: 'How to address negative AI perception.',
    category: 'Advanced',
    readTime: '9 min',
    lastUpdated: '2024-12-01',
    relatedArticles: ['building-authority', 'ai-provider-differences'],
    content: `
## Identifying AI Reputation Crises

An AI reputation crisis occurs when AI systems consistently provide negative, inaccurate, or damaging information about your brand.

## Warning Signs

### Immediate Red Flags
- AI warns users against your brand
- Factually incorrect information spreading
- Competitors consistently favored
- Negative sentiment dominating

### Emerging Issues
- Score dropping consistently
- New negative mentions appearing
- Accuracy issues increasing
- Authority declining

## Crisis Response Framework

### Phase 1: Assessment (24-48 hours)

1. **Document the issue**
   - Capture all problematic AI responses
   - Note which providers affected
   - Identify the source of misinformation

2. **Assess severity**
   - Business impact potential
   - Spread across platforms
   - Accuracy of claims

3. **Identify root cause**
   - Negative news coverage?
   - Review platform issues?
   - Competitor activity?
   - Outdated information?

### Phase 2: Containment (1-2 weeks)

1. **Create authoritative content**
   - Directly address inaccuracies
   - Publish official statements
   - Update key pages with correct info

2. **Build positive signals**
   - Generate positive reviews
   - Publish customer success stories
   - Secure positive media coverage

3. **Request corrections**
   - Contact AI providers if applicable
   - Update Wikipedia/knowledge bases
   - Correct directory listings

### Phase 3: Recovery (1-3 months)

1. **Sustained content campaign**
   - Regular positive content publication
   - Expert commentary
   - Industry participation

2. **Citation building**
   - Get mentioned in authoritative sources
   - Build backlinks from trusted sites
   - Contribute to industry publications

3. **Monitoring**
   - Track AI responses weekly
   - Document improvement
   - Adjust strategy as needed

## Prevention Strategies

### Proactive Monitoring
- Set up regular AI perception checks
- Track competitor AI mentions
- Monitor review platforms

### Content Foundation
- Maintain comprehensive, accurate content
- Update information regularly
- Build authority continuously

### Reputation Reserve
- Build positive review pipeline
- Maintain media relationships
- Document customer success

## When to Escalate

Consider legal/PR intervention if:
- Demonstrably false claims causing harm
- Competitor manipulation suspected
- Defamatory content persisting
- Significant business impact
    `,
  },
};

// ================================================================
// METADATA
// ================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articleContents[slug];

  if (!article) {
    return { title: 'Article Not Found' };
  }

  return {
    title: `${article.title} - Help Center`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
    },
  };
}

// ================================================================
// PAGE
// ================================================================

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleContents[slug];

  if (!article) {
    notFound();
  }

  const relatedArticles = article.relatedArticles
    .map((id) => articleContents[id])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-gray-900 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/help"
            className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block"
          >
            Back to Help Center
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
            <span className="bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">
              {article.category}
            </span>
            <span>{article.readTime} read</span>
            <span>Updated {article.lastUpdated}</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{article.title}</h1>
          <p className="text-gray-300 mt-2">{article.description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-invert prose-indigo max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-code:text-indigo-300 prose-pre:bg-gray-800">
          <div
            dangerouslySetInnerHTML={{
              __html: article.content
                .replace(/^## /gm, '<h2>')
                .replace(/^### /gm, '<h3>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/<h2>/g, '</p><h2>')
                .replace(/<h3>/g, '</p><h3>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-400 hover:text-indigo-300">$1</a>')
                .replace(/```json\n([\s\S]*?)```/g, '<pre class="bg-gray-800 rounded-lg p-4 overflow-x-auto"><code>$1</code></pre>')
                .replace(/```\n([\s\S]*?)```/g, '<pre class="bg-gray-800 rounded-lg p-4 overflow-x-auto"><code>$1</code></pre>')
                .replace(/\| ([^|]+) \|/g, '<td class="border border-gray-700 px-3 py-2">$1</td>')
            }}
          />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/help/${related.id}`}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors"
                >
                  <p className="font-medium text-white">{related.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{related.readTime} read</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="mt-12 bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-white mb-2">Was this article helpful?</p>
          <div className="flex justify-center gap-4">
            <button className="px-4 py-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors">
              Yes, helpful
            </button>
            <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors">
              Needs improvement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
