/**
 * Programmatic Industry Page
 *
 * Phase 4, Week 8, Day 2
 * SEO-optimized industry-specific landing pages
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ================================================================
// INDUSTRY DATA
// ================================================================

interface IndustryData {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  challenges: string[];
  benefits: string[];
  cta: string;
  relatedIndustries: string[];
  keywords: string[];
}

const INDUSTRY_DATA: Record<string, IndustryData> = {
  saas: {
    slug: 'saas',
    name: 'SaaS',
    title: 'AI Perception for SaaS Companies',
    description:
      'Discover how AI models like ChatGPT and Claude recommend SaaS products. Optimize your AI visibility and get recommended more often.',
    h1: 'How AI Models Recommend SaaS Products',
    intro:
      'In the age of AI-powered search, SaaS companies need to understand how Large Language Models perceive and recommend their products. When users ask ChatGPT or Claude for software recommendations, will your product be mentioned?',
    challenges: [
      'AI models may recommend competitors instead of you',
      'Your product descriptions may not be AI-readable',
      'Missing structured data hurts AI understanding',
      'Outdated information in AI training data',
    ],
    benefits: [
      'Get recommended by ChatGPT, Claude, Gemini, and Perplexity',
      'Increase discovery through AI-powered search',
      'Understand competitor positioning in AI responses',
      'Track AI perception changes over time',
    ],
    cta: 'Analyze Your SaaS AI Perception',
    relatedIndustries: ['fintech', 'marketing', 'cybersecurity'],
    keywords: ['saas ai perception', 'software ai recommendations', 'llm saas visibility'],
  },
  ecommerce: {
    slug: 'ecommerce',
    name: 'E-commerce',
    title: 'AI Perception for E-commerce Brands',
    description:
      'See how AI assistants recommend e-commerce brands. Improve your visibility in AI-powered shopping recommendations.',
    h1: 'How AI Assistants Recommend E-commerce Brands',
    intro:
      'Consumers increasingly use AI assistants to find products and compare brands. Understanding how ChatGPT, Claude, and other AI models perceive your e-commerce brand is crucial for staying competitive.',
    challenges: [
      'AI may recommend larger competitors by default',
      'Product catalog not optimized for AI understanding',
      'Missing Schema.org markup on product pages',
      'Reviews and ratings not reflected in AI responses',
    ],
    benefits: [
      'Appear in AI-powered product recommendations',
      'Stand out from competitors in AI responses',
      'Leverage positive reviews in AI perception',
      'Track seasonal AI perception trends',
    ],
    cta: 'Analyze Your E-commerce AI Perception',
    relatedIndustries: ['retail', 'logistics', 'marketing'],
    keywords: ['ecommerce ai visibility', 'online store ai recommendations', 'shopping assistant optimization'],
  },
  fintech: {
    slug: 'fintech',
    name: 'Fintech',
    title: 'AI Perception for Fintech Companies',
    description:
      'Analyze how AI models recommend fintech products and services. Build trust through AI visibility.',
    h1: 'How AI Models Recommend Financial Technology',
    intro:
      'Trust is everything in fintech. When AI assistants recommend financial products, they prioritize established, trustworthy brands. Ensure your fintech company is perceived as a leader in your category.',
    challenges: [
      'AI models favor established financial institutions',
      'Regulatory compliance not reflected in AI understanding',
      'Security credentials not visible to AI',
      'Complex products poorly summarized by AI',
    ],
    benefits: [
      'Build AI-visible trust signals',
      'Highlight compliance and security credentials',
      'Differentiate from traditional banking',
      'Target AI users seeking financial innovation',
    ],
    cta: 'Analyze Your Fintech AI Perception',
    relatedIndustries: ['saas', 'insurance', 'cybersecurity'],
    keywords: ['fintech ai perception', 'financial services ai visibility', 'banking ai recommendations'],
  },
  healthcare: {
    slug: 'healthcare',
    name: 'Healthcare',
    title: 'AI Perception for Healthcare Organizations',
    description:
      'Understand how AI models discuss healthcare providers and services. Ensure accurate AI representation.',
    h1: 'How AI Models Represent Healthcare Organizations',
    intro:
      'Healthcare information accuracy is critical. AI assistants are increasingly used to find healthcare providers, understand conditions, and compare treatment options. Ensure your organization is accurately represented.',
    challenges: [
      'Medical misinformation in AI responses',
      'Specialty services not recognized by AI',
      'HIPAA considerations for AI visibility',
      'Outdated provider information in AI training data',
    ],
    benefits: [
      'Accurate representation in AI health queries',
      'Highlight specializations and credentials',
      'Improve patient discovery through AI',
      'Monitor AI accuracy for healthcare information',
    ],
    cta: 'Analyze Your Healthcare AI Perception',
    relatedIndustries: ['insurance', 'nonprofit', 'education'],
    keywords: ['healthcare ai visibility', 'medical provider ai recommendations', 'health services ai perception'],
  },
  education: {
    slug: 'education',
    name: 'Education',
    title: 'AI Perception for Educational Institutions',
    description:
      'See how AI models recommend educational programs and institutions. Attract students through AI visibility.',
    h1: 'How AI Models Recommend Educational Programs',
    intro:
      'Students and parents increasingly use AI assistants to research educational options. Understanding how ChatGPT and other AI models describe your institution can impact enrollment.',
    challenges: [
      'AI may favor larger, more established institutions',
      'Program strengths not reflected in AI responses',
      'Rankings and accreditations poorly represented',
      'Alumni success stories missing from AI knowledge',
    ],
    benefits: [
      'Appear in AI education recommendations',
      'Highlight unique programs and strengths',
      'Showcase accreditations and rankings',
      'Track competitor positioning in AI responses',
    ],
    cta: 'Analyze Your Education AI Perception',
    relatedIndustries: ['nonprofit', 'consulting', 'healthcare'],
    keywords: ['education ai perception', 'university ai visibility', 'school ai recommendations'],
  },
  'real-estate': {
    slug: 'real-estate',
    name: 'Real Estate',
    title: 'AI Perception for Real Estate Companies',
    description:
      'Discover how AI assistants recommend real estate services. Improve visibility in property searches.',
    h1: 'How AI Models Recommend Real Estate Services',
    intro:
      'Home buyers and sellers are using AI assistants to research real estate markets and find agents. Ensure your real estate business is visible in AI-powered property recommendations.',
    challenges: [
      'Local market expertise not reflected in AI',
      'Property listings not AI-optimized',
      'Agent credentials poorly represented',
      'Market knowledge not visible to AI',
    ],
    benefits: [
      'Appear in AI real estate recommendations',
      'Highlight local market expertise',
      'Showcase agent credentials and track record',
      'Target AI users searching for properties',
    ],
    cta: 'Analyze Your Real Estate AI Perception',
    relatedIndustries: ['legal', 'insurance', 'consulting'],
    keywords: ['real estate ai visibility', 'property ai recommendations', 'realtor ai perception'],
  },
  legal: {
    slug: 'legal',
    name: 'Legal',
    title: 'AI Perception for Law Firms',
    description:
      'Analyze how AI models recommend legal services. Build trust and visibility in AI-powered legal searches.',
    h1: 'How AI Models Recommend Legal Services',
    intro:
      'Clients increasingly use AI assistants to find lawyers and understand legal options. Understanding how AI perceives your law firm can impact client acquisition.',
    challenges: [
      'Practice areas not clearly understood by AI',
      'Case results and credentials poorly represented',
      'Local bar standing not visible to AI',
      'Specializations not reflected in AI responses',
    ],
    benefits: [
      'Appear in AI legal service recommendations',
      'Highlight practice areas and expertise',
      'Showcase credentials and case results',
      'Target AI users seeking legal help',
    ],
    cta: 'Analyze Your Legal AI Perception',
    relatedIndustries: ['real-estate', 'insurance', 'consulting'],
    keywords: ['law firm ai visibility', 'legal services ai recommendations', 'attorney ai perception'],
  },
  marketing: {
    slug: 'marketing',
    name: 'Marketing',
    title: 'AI Perception for Marketing Agencies',
    description:
      'See how AI models recommend marketing services. Stand out in AI-powered agency searches.',
    h1: 'How AI Models Recommend Marketing Agencies',
    intro:
      'Businesses use AI assistants to find marketing partners and evaluate agencies. Ensure your marketing agency stands out when AI recommends service providers.',
    challenges: [
      'Agency differentiators not clear to AI',
      'Case studies and results not AI-visible',
      'Service offerings poorly categorized',
      'Industry expertise not reflected in AI responses',
    ],
    benefits: [
      'Appear in AI agency recommendations',
      'Highlight unique methodologies and results',
      'Showcase client success stories',
      'Target AI users seeking marketing help',
    ],
    cta: 'Analyze Your Marketing AI Perception',
    relatedIndustries: ['saas', 'media', 'consulting'],
    keywords: ['marketing agency ai visibility', 'digital marketing ai recommendations', 'agency ai perception'],
  },
  consulting: {
    slug: 'consulting',
    name: 'Consulting',
    title: 'AI Perception for Consulting Firms',
    description:
      'Understand how AI models recommend consulting services. Build thought leadership in AI responses.',
    h1: 'How AI Models Recommend Consulting Services',
    intro:
      'Executives and business leaders use AI to research consulting options. Understanding how AI perceives your consulting firm can impact your pipeline.',
    challenges: [
      'Expertise areas not clearly defined for AI',
      'Thought leadership not reflected in AI knowledge',
      'Industry experience poorly represented',
      'Methodology differentiators not visible to AI',
    ],
    benefits: [
      'Appear in AI consulting recommendations',
      'Highlight industry expertise and methodologies',
      'Showcase thought leadership content',
      'Target AI users seeking business advice',
    ],
    cta: 'Analyze Your Consulting AI Perception',
    relatedIndustries: ['legal', 'marketing', 'fintech'],
    keywords: ['consulting ai visibility', 'business consulting ai recommendations', 'consultant ai perception'],
  },
  manufacturing: {
    slug: 'manufacturing',
    name: 'Manufacturing',
    title: 'AI Perception for Manufacturers',
    description:
      'Analyze how AI models recommend manufacturing partners. Improve visibility in B2B AI searches.',
    h1: 'How AI Models Recommend Manufacturing Partners',
    intro:
      'B2B buyers use AI assistants to research manufacturing partners and suppliers. Ensure your manufacturing capabilities are visible in AI-powered sourcing.',
    challenges: [
      'Technical capabilities not AI-readable',
      'Certifications and quality standards poorly represented',
      'Production capacity not visible to AI',
      'Industry specializations not clear',
    ],
    benefits: [
      'Appear in AI manufacturing recommendations',
      'Highlight certifications and capabilities',
      'Showcase quality and capacity',
      'Target B2B AI users sourcing partners',
    ],
    cta: 'Analyze Your Manufacturing AI Perception',
    relatedIndustries: ['logistics', 'automotive', 'energy'],
    keywords: ['manufacturing ai visibility', 'b2b manufacturing ai recommendations', 'factory ai perception'],
  },
  retail: {
    slug: 'retail',
    name: 'Retail',
    title: 'AI Perception for Retail Brands',
    description:
      'See how AI assistants recommend retail stores and brands. Optimize for AI-powered shopping.',
    h1: 'How AI Models Recommend Retail Brands',
    intro:
      'Shoppers use AI assistants to find stores, compare products, and get recommendations. Understanding your retail AI perception is key to driving foot traffic and online sales.',
    challenges: [
      'Store locations not visible to AI',
      'Product selection poorly represented',
      'Brand values not reflected in AI responses',
      'Customer experience not AI-visible',
    ],
    benefits: [
      'Appear in AI shopping recommendations',
      'Highlight store locations and products',
      'Showcase brand values and experience',
      'Target AI users making purchase decisions',
    ],
    cta: 'Analyze Your Retail AI Perception',
    relatedIndustries: ['ecommerce', 'hospitality', 'logistics'],
    keywords: ['retail ai visibility', 'store ai recommendations', 'brand ai perception'],
  },
  hospitality: {
    slug: 'hospitality',
    name: 'Hospitality',
    title: 'AI Perception for Hotels & Restaurants',
    description:
      'Discover how AI recommends hospitality venues. Improve visibility in AI travel planning.',
    h1: 'How AI Models Recommend Hotels and Restaurants',
    intro:
      'Travelers use AI assistants to plan trips, find hotels, and discover restaurants. Ensure your hospitality business appears in AI travel recommendations.',
    challenges: [
      'Location and amenities not AI-visible',
      'Reviews and ratings poorly represented',
      'Unique experiences not reflected in AI',
      'Booking information not accessible to AI',
    ],
    benefits: [
      'Appear in AI travel recommendations',
      'Highlight amenities and experiences',
      'Leverage positive reviews in AI perception',
      'Target AI users planning trips',
    ],
    cta: 'Analyze Your Hospitality AI Perception',
    relatedIndustries: ['retail', 'real-estate', 'media'],
    keywords: ['hotel ai visibility', 'restaurant ai recommendations', 'hospitality ai perception'],
  },
  insurance: {
    slug: 'insurance',
    name: 'Insurance',
    title: 'AI Perception for Insurance Companies',
    description:
      'Analyze how AI models recommend insurance products. Build trust in AI-powered comparisons.',
    h1: 'How AI Models Recommend Insurance Products',
    intro:
      'Consumers use AI assistants to compare insurance options and understand coverage. Ensure your insurance products are accurately represented in AI responses.',
    challenges: [
      'Complex products poorly summarized by AI',
      'Coverage details not AI-visible',
      'Trust signals not reflected in AI responses',
      'Pricing transparency issues with AI',
    ],
    benefits: [
      'Appear in AI insurance comparisons',
      'Highlight coverage and trust factors',
      'Simplify product understanding for AI',
      'Target AI users shopping for insurance',
    ],
    cta: 'Analyze Your Insurance AI Perception',
    relatedIndustries: ['fintech', 'healthcare', 'legal'],
    keywords: ['insurance ai visibility', 'coverage ai recommendations', 'insurer ai perception'],
  },
  logistics: {
    slug: 'logistics',
    name: 'Logistics',
    title: 'AI Perception for Logistics Companies',
    description:
      'See how AI recommends logistics and shipping services. Improve B2B visibility in AI searches.',
    h1: 'How AI Models Recommend Logistics Services',
    intro:
      'Businesses use AI to find shipping and logistics partners. Ensure your logistics capabilities are visible when AI recommends supply chain solutions.',
    challenges: [
      'Service coverage not AI-visible',
      'Capabilities poorly categorized for AI',
      'Reliability and speed not reflected',
      'B2B specializations not clear to AI',
    ],
    benefits: [
      'Appear in AI logistics recommendations',
      'Highlight service coverage and capabilities',
      'Showcase reliability and performance',
      'Target B2B AI users sourcing logistics',
    ],
    cta: 'Analyze Your Logistics AI Perception',
    relatedIndustries: ['manufacturing', 'ecommerce', 'retail'],
    keywords: ['logistics ai visibility', 'shipping ai recommendations', 'supply chain ai perception'],
  },
  media: {
    slug: 'media',
    name: 'Media',
    title: 'AI Perception for Media Companies',
    description:
      'Understand how AI cites and recommends media sources. Improve authority in AI-powered information.',
    h1: 'How AI Models Cite Media Sources',
    intro:
      'AI assistants cite media sources when answering questions. Understanding how your media brand is perceived and cited by AI can impact reach and authority.',
    challenges: [
      'Content not indexed in AI training data',
      'Authority signals not visible to AI',
      'Expertise areas poorly defined',
      'Citation patterns not optimized',
    ],
    benefits: [
      'Get cited by AI assistants',
      'Build authority in AI responses',
      'Increase content reach through AI',
      'Track AI citation patterns',
    ],
    cta: 'Analyze Your Media AI Perception',
    relatedIndustries: ['marketing', 'education', 'consulting'],
    keywords: ['media ai visibility', 'news ai citations', 'publisher ai perception'],
  },
  nonprofit: {
    slug: 'nonprofit',
    name: 'Nonprofit',
    title: 'AI Perception for Nonprofits',
    description:
      'See how AI recommends charitable organizations. Improve visibility for your cause.',
    h1: 'How AI Models Recommend Nonprofits',
    intro:
      'Donors use AI to research charities and find causes to support. Ensure your nonprofit is visible and accurately represented in AI recommendations.',
    challenges: [
      'Mission and impact not AI-visible',
      'Charity ratings not reflected in AI',
      'Programs poorly described to AI',
      'Donation information not accessible',
    ],
    benefits: [
      'Appear in AI charity recommendations',
      'Highlight mission and impact',
      'Showcase transparency and ratings',
      'Target AI users seeking causes to support',
    ],
    cta: 'Analyze Your Nonprofit AI Perception',
    relatedIndustries: ['education', 'healthcare', 'media'],
    keywords: ['nonprofit ai visibility', 'charity ai recommendations', 'organization ai perception'],
  },
  automotive: {
    slug: 'automotive',
    name: 'Automotive',
    title: 'AI Perception for Automotive Brands',
    description:
      'Analyze how AI recommends vehicles and automotive services. Improve visibility in AI car shopping.',
    h1: 'How AI Models Recommend Automotive Brands',
    intro:
      'Car buyers use AI assistants to research vehicles and compare brands. Understanding your automotive AI perception can impact sales and brand preference.',
    challenges: [
      'Vehicle features not AI-readable',
      'Dealer network not visible to AI',
      'Safety ratings poorly represented',
      'EV/sustainability messaging not clear',
    ],
    benefits: [
      'Appear in AI vehicle recommendations',
      'Highlight features and safety ratings',
      'Showcase dealer network and service',
      'Target AI users shopping for cars',
    ],
    cta: 'Analyze Your Automotive AI Perception',
    relatedIndustries: ['manufacturing', 'energy', 'insurance'],
    keywords: ['automotive ai visibility', 'car ai recommendations', 'vehicle ai perception'],
  },
  energy: {
    slug: 'energy',
    name: 'Energy',
    title: 'AI Perception for Energy Companies',
    description:
      'See how AI discusses energy providers and solutions. Improve visibility in sustainability conversations.',
    h1: 'How AI Models Discuss Energy Companies',
    intro:
      'Consumers and businesses use AI to research energy options and sustainability. Ensure your energy company is accurately represented in AI-powered decisions.',
    challenges: [
      'Sustainability initiatives not AI-visible',
      'Service areas poorly defined',
      'Pricing and plans not accessible to AI',
      'Innovation and clean energy not reflected',
    ],
    benefits: [
      'Appear in AI energy recommendations',
      'Highlight sustainability and innovation',
      'Showcase service coverage and pricing',
      'Target AI users seeking energy solutions',
    ],
    cta: 'Analyze Your Energy AI Perception',
    relatedIndustries: ['manufacturing', 'automotive', 'real-estate'],
    keywords: ['energy ai visibility', 'utility ai recommendations', 'power company ai perception'],
  },
  telecom: {
    slug: 'telecom',
    name: 'Telecom',
    title: 'AI Perception for Telecom Providers',
    description:
      'Understand how AI recommends telecom services. Improve visibility in connectivity conversations.',
    h1: 'How AI Models Recommend Telecom Services',
    intro:
      'Consumers use AI to compare phone plans, internet providers, and telecom services. Ensure your offerings are visible in AI-powered comparisons.',
    challenges: [
      'Coverage maps not AI-visible',
      'Plan details poorly represented',
      'Network quality not reflected in AI',
      'Bundle options not clear to AI',
    ],
    benefits: [
      'Appear in AI telecom comparisons',
      'Highlight coverage and network quality',
      'Showcase plans and bundles',
      'Target AI users shopping for services',
    ],
    cta: 'Analyze Your Telecom AI Perception',
    relatedIndustries: ['saas', 'media', 'retail'],
    keywords: ['telecom ai visibility', 'phone plan ai recommendations', 'internet provider ai perception'],
  },
  cybersecurity: {
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    title: 'AI Perception for Cybersecurity Companies',
    description:
      'Analyze how AI recommends security solutions. Build trust in AI-powered security conversations.',
    h1: 'How AI Models Recommend Cybersecurity Solutions',
    intro:
      'Businesses use AI to research security solutions and evaluate vendors. Understanding how AI perceives your cybersecurity company can impact enterprise sales.',
    challenges: [
      'Technical capabilities not AI-readable',
      'Certifications and compliance not visible',
      'Threat intelligence not reflected in AI',
      'Product differentiators not clear to AI',
    ],
    benefits: [
      'Appear in AI security recommendations',
      'Highlight certifications and capabilities',
      'Build trust through AI visibility',
      'Target AI users evaluating security',
    ],
    cta: 'Analyze Your Cybersecurity AI Perception',
    relatedIndustries: ['saas', 'fintech', 'consulting'],
    keywords: ['cybersecurity ai visibility', 'security vendor ai recommendations', 'infosec ai perception'],
  },
};

// ================================================================
// STATIC PARAMS
// ================================================================

export async function generateStaticParams(): Promise<{ industry: string }[]> {
  return Object.keys(INDUSTRY_DATA).map((industry) => ({
    industry,
  }));
}

// ================================================================
// METADATA
// ================================================================

interface PageProps {
  params: Promise<{ industry: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry } = await params;
  const data = INDUSTRY_DATA[industry];

  if (!data) {
    return {
      title: 'Industry Not Found | AI Perception',
    };
  }

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website',
      url: `https://aiperception.io/ai-perception/${industry}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
    alternates: {
      canonical: `https://aiperception.io/ai-perception/${industry}`,
    },
  };
}

// ================================================================
// PAGE COMPONENT
// ================================================================

export default async function IndustryPage({ params }: PageProps) {
  const { industry } = await params;
  const data = INDUSTRY_DATA[industry];

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm mb-6">
            {data.name} Industry
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">{data.h1}</h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">{data.intro}</p>

          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            {data.cta}
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            AI Perception Challenges for {data.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {data.challenges.map((challenge, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex-shrink-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-300">{challenge}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Improve Your {data.name} AI Perception
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {data.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Improve Your {data.name} AI Perception?
          </h2>
          <p className="text-gray-400 mb-8">
            Get your free AI Perception Score and see how ChatGPT, Claude, Gemini, and Perplexity perceive your brand.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Analyze Your Brand Free
          </Link>
        </div>
      </section>

      {/* Related Industries */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Related Industries</h2>
          <div className="flex flex-wrap gap-3">
            {data.relatedIndustries.map((related) => {
              const relatedData = INDUSTRY_DATA[related];
              if (!relatedData) return null;
              return (
                <Link
                  key={related}
                  href={`/ai-perception/${related}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
                >
                  {relatedData.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: data.title,
            description: data.description,
            url: `https://aiperception.io/ai-perception/${industry}`,
            mainEntity: {
              '@type': 'Service',
              name: `AI Perception Analysis for ${data.name}`,
              provider: {
                '@type': 'Organization',
                name: 'AI Perception',
                url: 'https://aiperception.io',
              },
              serviceType: 'AI Visibility Analysis',
              areaServed: 'Worldwide',
            },
          }),
        }}
      />
    </main>
  );
}
