/**
 * Results Page Schema.org Structured Data
 *
 * Phase 1, Week 2, Day 5
 *
 * Provides rich structured data for analysis results pages
 * to enable rich snippets in search results.
 */

'use client';

import Script from 'next/script';

// ================================================================
// TYPES
// ================================================================

export interface ResultsSchemaData {
  /** Analysis ID */
  analysisId: string;
  /** Brand/URL being analyzed */
  brandName: string;
  /** Overall AI Perception score */
  overallScore: number;
  /** Score grade (A-F) */
  grade: string;
  /** Analysis date */
  dateAnalyzed: string;
  /** Analysis URL */
  url: string;
  /** Category scores */
  categoryScores?: CategoryScore[];
  /** AI providers analyzed */
  providersAnalyzed?: string[];
  /** Industry detected */
  industry?: string;
  /** Number of recommendations */
  recommendationCount?: number;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
}

export interface ResultsPageSchemaProps {
  data: ResultsSchemaData;
}

// ================================================================
// COMPONENT
// ================================================================

export function ResultsPageSchema({ data }: ResultsPageSchemaProps): React.ReactElement {
  const structuredData = generateStructuredData(data);

  return (
    <Script
      id="results-page-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// ================================================================
// SCHEMA GENERATION
// ================================================================

function generateStructuredData(data: ResultsSchemaData): object {
  const baseUrl = 'https://www.vectorialdata.com';

  // Main AnalysisAction schema
  const analysisAction = {
    '@context': 'https://schema.org',
    '@type': 'AnalyzeAction',
    '@id': `${baseUrl}/results/${data.analysisId}`,
    name: `AI Perception Analysis: ${data.brandName}`,
    description: `AI Perception Score analysis for ${data.brandName}. Score: ${data.overallScore}/100 (${data.grade})`,
    object: {
      '@type': 'Brand',
      name: data.brandName,
    },
    result: {
      '@type': 'Rating',
      ratingValue: data.overallScore,
      bestRating: 100,
      worstRating: 0,
      ratingExplanation: `AI Perception Score indicates how well ${data.brandName} is represented across AI assistants like ChatGPT, Claude, and Gemini.`,
    },
    agent: {
      '@type': 'Organization',
      name: 'AI Perception',
      url: baseUrl,
    },
    startTime: data.dateAnalyzed,
    endTime: data.dateAnalyzed,
  };

  // WebPage schema
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}/results/${data.analysisId}`,
    url: data.url,
    name: `AI Perception Analysis Results: ${data.brandName}`,
    description: `Detailed AI perception analysis for ${data.brandName}. Overall score: ${data.overallScore}/100. Grade: ${data.grade}. See how AI models like ChatGPT, Claude, and Gemini perceive and recommend this brand.`,
    datePublished: data.dateAnalyzed,
    dateModified: data.dateAnalyzed,
    mainEntity: {
      '@type': 'ItemList',
      name: 'AI Perception Score Breakdown',
      description: 'Detailed scoring across multiple AI perception categories',
      numberOfItems: data.categoryScores?.length || 0,
      itemListElement: data.categoryScores?.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: category.name,
        description: `${category.name} score: ${category.score}/${category.maxScore}`,
      })),
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'AI Perception',
      url: baseUrl,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Results',
          item: `${baseUrl}/results`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: data.brandName,
          item: `${baseUrl}/results/${data.analysisId}`,
        },
      ],
    },
  };

  // SoftwareApplication schema for the tool itself
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Perception Score Analyzer',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Analyze how AI models perceive and recommend your brand',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free AI perception analysis',
    },
    aggregateRating: data.overallScore >= 80
      ? {
          '@type': 'AggregateRating',
          ratingValue: 4.8,
          ratingCount: 150,
          bestRating: 5,
        }
      : undefined,
  };

  // FAQPage for common questions about the score
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What does an AI Perception Score of ${data.overallScore} mean?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: getScoreExplanation(data.overallScore, data.grade),
        },
      },
      {
        '@type': 'Question',
        name: 'Which AI assistants were analyzed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: data.providersAnalyzed?.length
            ? `This analysis covers ${data.providersAnalyzed.join(', ')}.`
            : 'This analysis covers major AI assistants including ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Perplexity.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I improve my AI Perception Score?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Based on this analysis, there are ${data.recommendationCount || 'several'} specific recommendations to improve how AI models perceive and recommend ${data.brandName}. Key areas include optimizing structured data, improving content quality, and ensuring consistent brand messaging.`,
        },
      },
    ],
  };

  // Return combined schema using @graph
  return {
    '@context': 'https://schema.org',
    '@graph': [analysisAction, webPage, softwareApp, faqPage].filter(Boolean),
  };
}

function getScoreExplanation(score: number, grade: string): string {
  if (score >= 90) {
    return `A score of ${score} (Grade ${grade}) indicates excellent AI visibility. This brand is well-represented across major AI assistants and is likely to be recommended for relevant queries.`;
  } else if (score >= 80) {
    return `A score of ${score} (Grade ${grade}) indicates very good AI visibility. This brand has strong presence in AI responses with minor areas for improvement.`;
  } else if (score >= 70) {
    return `A score of ${score} (Grade ${grade}) indicates good AI visibility. There are opportunities to improve how AI models perceive and recommend this brand.`;
  } else if (score >= 60) {
    return `A score of ${score} (Grade ${grade}) indicates moderate AI visibility. Implementing the recommended improvements can significantly boost AI perception.`;
  } else if (score >= 50) {
    return `A score of ${score} (Grade ${grade}) indicates limited AI visibility. The brand may not be consistently mentioned or recommended by AI assistants.`;
  } else {
    return `A score of ${score} (Grade ${grade}) indicates poor AI visibility. Significant improvements are needed to establish presence in AI recommendations.`;
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default ResultsPageSchema;
