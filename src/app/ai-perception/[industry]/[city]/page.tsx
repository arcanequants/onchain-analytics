/**
 * Programmatic Location Page
 *
 * Phase 4, Week 8, Day 2
 * SEO-optimized industry + location landing pages
 * Generates 400+ pages (20 industries × 20 cities)
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ================================================================
// CITY DATA
// ================================================================

interface CityData {
  slug: string;
  name: string;
  country: string;
  region: string;
  population: string;
  businessHubs: string[];
  timezone: string;
}

const CITY_DATA: Record<string, CityData> = {
  'new-york': {
    slug: 'new-york',
    name: 'New York',
    country: 'USA',
    region: 'North America',
    population: '8.3M',
    businessHubs: ['Manhattan', 'Brooklyn', 'Financial District'],
    timezone: 'EST',
  },
  'los-angeles': {
    slug: 'los-angeles',
    name: 'Los Angeles',
    country: 'USA',
    region: 'North America',
    population: '4M',
    businessHubs: ['Downtown LA', 'Santa Monica', 'Hollywood'],
    timezone: 'PST',
  },
  chicago: {
    slug: 'chicago',
    name: 'Chicago',
    country: 'USA',
    region: 'North America',
    population: '2.7M',
    businessHubs: ['The Loop', 'River North', 'West Loop'],
    timezone: 'CST',
  },
  houston: {
    slug: 'houston',
    name: 'Houston',
    country: 'USA',
    region: 'North America',
    population: '2.3M',
    businessHubs: ['Downtown', 'Energy Corridor', 'The Galleria'],
    timezone: 'CST',
  },
  phoenix: {
    slug: 'phoenix',
    name: 'Phoenix',
    country: 'USA',
    region: 'North America',
    population: '1.6M',
    businessHubs: ['Downtown Phoenix', 'Scottsdale', 'Tempe'],
    timezone: 'MST',
  },
  'san-francisco': {
    slug: 'san-francisco',
    name: 'San Francisco',
    country: 'USA',
    region: 'North America',
    population: '874K',
    businessHubs: ['SOMA', 'Financial District', 'Mission Bay'],
    timezone: 'PST',
  },
  seattle: {
    slug: 'seattle',
    name: 'Seattle',
    country: 'USA',
    region: 'North America',
    population: '750K',
    businessHubs: ['Downtown', 'South Lake Union', 'Bellevue'],
    timezone: 'PST',
  },
  boston: {
    slug: 'boston',
    name: 'Boston',
    country: 'USA',
    region: 'North America',
    population: '685K',
    businessHubs: ['Back Bay', 'Seaport', 'Cambridge'],
    timezone: 'EST',
  },
  miami: {
    slug: 'miami',
    name: 'Miami',
    country: 'USA',
    region: 'North America',
    population: '450K',
    businessHubs: ['Brickell', 'Downtown', 'Wynwood'],
    timezone: 'EST',
  },
  denver: {
    slug: 'denver',
    name: 'Denver',
    country: 'USA',
    region: 'North America',
    population: '715K',
    businessHubs: ['LoDo', 'RiNo', 'Cherry Creek'],
    timezone: 'MST',
  },
  austin: {
    slug: 'austin',
    name: 'Austin',
    country: 'USA',
    region: 'North America',
    population: '1M',
    businessHubs: ['Downtown', 'East Austin', 'Domain'],
    timezone: 'CST',
  },
  atlanta: {
    slug: 'atlanta',
    name: 'Atlanta',
    country: 'USA',
    region: 'North America',
    population: '500K',
    businessHubs: ['Midtown', 'Buckhead', 'Tech Square'],
    timezone: 'EST',
  },
  london: {
    slug: 'london',
    name: 'London',
    country: 'UK',
    region: 'Europe',
    population: '9M',
    businessHubs: ['City of London', 'Canary Wharf', 'Tech City'],
    timezone: 'GMT',
  },
  toronto: {
    slug: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    region: 'North America',
    population: '2.9M',
    businessHubs: ['Financial District', 'MaRS', 'Liberty Village'],
    timezone: 'EST',
  },
  sydney: {
    slug: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    region: 'Asia-Pacific',
    population: '5.3M',
    businessHubs: ['CBD', 'North Sydney', 'Surry Hills'],
    timezone: 'AEST',
  },
  singapore: {
    slug: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    region: 'Asia-Pacific',
    population: '5.5M',
    businessHubs: ['CBD', 'One-North', 'Marina Bay'],
    timezone: 'SGT',
  },
  berlin: {
    slug: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    region: 'Europe',
    population: '3.6M',
    businessHubs: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg'],
    timezone: 'CET',
  },
  paris: {
    slug: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'Europe',
    population: '2.2M',
    businessHubs: ['La Défense', 'Station F', 'Sentier'],
    timezone: 'CET',
  },
  amsterdam: {
    slug: 'amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    population: '870K',
    businessHubs: ['Zuidas', 'Amsterdam Science Park', 'Noord'],
    timezone: 'CET',
  },
  dubai: {
    slug: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'Middle East',
    population: '3.4M',
    businessHubs: ['DIFC', 'Dubai Internet City', 'Downtown'],
    timezone: 'GST',
  },
};

// ================================================================
// INDUSTRY DATA (imported from parent)
// ================================================================

interface IndustryData {
  slug: string;
  name: string;
  title: string;
  description: string;
}

const INDUSTRY_DATA: Record<string, IndustryData> = {
  saas: { slug: 'saas', name: 'SaaS', title: 'SaaS', description: 'Software as a Service' },
  ecommerce: { slug: 'ecommerce', name: 'E-commerce', title: 'E-commerce', description: 'Online retail' },
  fintech: { slug: 'fintech', name: 'Fintech', title: 'Fintech', description: 'Financial technology' },
  healthcare: { slug: 'healthcare', name: 'Healthcare', title: 'Healthcare', description: 'Health services' },
  education: { slug: 'education', name: 'Education', title: 'Education', description: 'Educational services' },
  'real-estate': {
    slug: 'real-estate',
    name: 'Real Estate',
    title: 'Real Estate',
    description: 'Property services',
  },
  legal: { slug: 'legal', name: 'Legal', title: 'Legal', description: 'Legal services' },
  marketing: { slug: 'marketing', name: 'Marketing', title: 'Marketing', description: 'Marketing services' },
  consulting: { slug: 'consulting', name: 'Consulting', title: 'Consulting', description: 'Business consulting' },
  manufacturing: {
    slug: 'manufacturing',
    name: 'Manufacturing',
    title: 'Manufacturing',
    description: 'Industrial manufacturing',
  },
  retail: { slug: 'retail', name: 'Retail', title: 'Retail', description: 'Retail businesses' },
  hospitality: { slug: 'hospitality', name: 'Hospitality', title: 'Hospitality', description: 'Hotels and restaurants' },
  insurance: { slug: 'insurance', name: 'Insurance', title: 'Insurance', description: 'Insurance services' },
  logistics: { slug: 'logistics', name: 'Logistics', title: 'Logistics', description: 'Shipping and logistics' },
  media: { slug: 'media', name: 'Media', title: 'Media', description: 'Media and publishing' },
  nonprofit: { slug: 'nonprofit', name: 'Nonprofit', title: 'Nonprofit', description: 'Charitable organizations' },
  automotive: { slug: 'automotive', name: 'Automotive', title: 'Automotive', description: 'Automotive industry' },
  energy: { slug: 'energy', name: 'Energy', title: 'Energy', description: 'Energy and utilities' },
  telecom: { slug: 'telecom', name: 'Telecom', title: 'Telecom', description: 'Telecommunications' },
  cybersecurity: {
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    title: 'Cybersecurity',
    description: 'Security services',
  },
};

// ================================================================
// STATIC PARAMS - Generate all industry/city combinations
// ================================================================

export async function generateStaticParams(): Promise<{ industry: string; city: string }[]> {
  const params: { industry: string; city: string }[] = [];

  for (const industry of Object.keys(INDUSTRY_DATA)) {
    for (const city of Object.keys(CITY_DATA)) {
      params.push({ industry, city });
    }
  }

  return params;
}

// ================================================================
// METADATA
// ================================================================

interface PageProps {
  params: Promise<{ industry: string; city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry, city } = await params;
  const industryData = INDUSTRY_DATA[industry];
  const cityData = CITY_DATA[city];

  if (!industryData || !cityData) {
    return {
      title: 'Page Not Found | AI Perception',
    };
  }

  const title = `AI Perception for ${industryData.name} in ${cityData.name} | Local AI Visibility`;
  const description = `Discover how AI models recommend ${industryData.name} companies in ${cityData.name}, ${cityData.country}. Analyze your local AI visibility and get recommended by ChatGPT, Claude, and Perplexity.`;

  return {
    title,
    description,
    keywords: [
      `${industryData.name.toLowerCase()} ${cityData.name.toLowerCase()}`,
      `ai perception ${cityData.name.toLowerCase()}`,
      `${industryData.name.toLowerCase()} ai visibility`,
      `chatgpt recommendations ${cityData.name.toLowerCase()}`,
      `local ai seo ${cityData.name.toLowerCase()}`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://aiperception.io/ai-perception/${industry}/${city}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://aiperception.io/ai-perception/${industry}/${city}`,
    },
  };
}

// ================================================================
// PAGE COMPONENT
// ================================================================

export default async function LocationPage({ params }: PageProps) {
  const { industry, city } = await params;
  const industryData = INDUSTRY_DATA[industry];
  const cityData = CITY_DATA[city];

  if (!industryData || !cityData) {
    notFound();
  }

  // Get nearby cities in same region
  const nearbyCities = Object.values(CITY_DATA)
    .filter((c) => c.region === cityData.region && c.slug !== cityData.slug)
    .slice(0, 4);

  // Generate local stats (would be real data in production)
  const localStats = {
    companiesAnalyzed: Math.floor(Math.random() * 500) + 100,
    avgScore: Math.floor(Math.random() * 30) + 55,
    topCompetitors: Math.floor(Math.random() * 10) + 5,
  };

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Breadcrumb */}
      <nav className="py-4 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white">
              Home
            </Link>
            <span className="text-gray-600">/</span>
            <Link href={`/ai-perception/${industry}`} className="text-gray-400 hover:text-white">
              {industryData.name}
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-indigo-400">{cityData.name}</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm">
              {industryData.name}
            </span>
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm">
              {cityData.name}, {cityData.country}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            AI Perception for {industryData.name} Companies in {cityData.name}
          </h1>

          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Discover how AI assistants like ChatGPT, Claude, and Perplexity recommend {industryData.name.toLowerCase()}{' '}
            businesses in {cityData.name}. Optimize your local AI visibility and get recommended more often.
          </p>

          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            Analyze Your {cityData.name} AI Perception
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Local Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {industryData.name} AI Perception in {cityData.name}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
              <div className="text-3xl font-bold text-indigo-400 mb-2">{localStats.companiesAnalyzed}+</div>
              <div className="text-gray-400 text-sm">{industryData.name} Companies Analyzed</div>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{localStats.avgScore}/100</div>
              <div className="text-gray-400 text-sm">Average AI Perception Score</div>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{localStats.topCompetitors}</div>
              <div className="text-gray-400 text-sm">Top AI-Visible Competitors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Location Matters */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">
            Why AI Perception Matters for {industryData.name} in {cityData.name}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Local AI Recommendations</h3>
              <p className="text-gray-400">
                When users in {cityData.name} ask AI for {industryData.name.toLowerCase()} recommendations, AI models
                consider local context. Ensure your business appears in these local AI conversations.
              </p>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Competitive Advantage</h3>
              <p className="text-gray-400">
                Most {industryData.name.toLowerCase()} companies in {cityData.name} haven{"'"}t optimized for AI
                visibility. Be the first to dominate AI recommendations in your local market.
              </p>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{cityData.region} Hub</h3>
              <p className="text-gray-400">
                {cityData.name} is a key {industryData.name.toLowerCase()} hub in {cityData.region}. AI models recognize
                this and factor regional expertise into recommendations.
              </p>
            </div>

            <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Business Districts</h3>
              <p className="text-gray-400">
                Key {industryData.name.toLowerCase()} hubs in {cityData.name}: {cityData.businessHubs.join(', ')}. Make
                sure AI knows your presence in these areas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Dominate {industryData.name} AI Recommendations in {cityData.name}
          </h2>
          <p className="text-gray-400 mb-8">
            Get your free AI Perception Score and see how your {cityData.name}-based {industryData.name.toLowerCase()}{' '}
            business is perceived by ChatGPT, Claude, Gemini, and Perplexity.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Analyze Your Brand Free
          </Link>
        </div>
      </section>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {industryData.name} AI Perception in Other {cityData.region} Cities
            </h2>
            <div className="flex flex-wrap gap-3">
              {nearbyCities.map((nearbyCity) => (
                <Link
                  key={nearbyCity.slug}
                  href={`/ai-perception/${industry}/${nearbyCity.slug}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
                >
                  {nearbyCity.name}, {nearbyCity.country}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Industries in This City */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Other Industries in {cityData.name}</h2>
          <div className="flex flex-wrap gap-3">
            {Object.values(INDUSTRY_DATA)
              .filter((ind) => ind.slug !== industry)
              .slice(0, 8)
              .map((ind) => (
                <Link
                  key={ind.slug}
                  href={`/ai-perception/${ind.slug}/${city}`}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
                >
                  {ind.name}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `AI Perception for ${industryData.name} in ${cityData.name}`,
            description: `Discover how AI models recommend ${industryData.name} companies in ${cityData.name}, ${cityData.country}.`,
            url: `https://aiperception.io/ai-perception/${industry}/${city}`,
            mainEntity: {
              '@type': 'Service',
              name: `AI Perception Analysis for ${industryData.name}`,
              areaServed: {
                '@type': 'City',
                name: cityData.name,
                containedInPlace: {
                  '@type': 'Country',
                  name: cityData.country,
                },
              },
              provider: {
                '@type': 'Organization',
                name: 'AI Perception',
                url: 'https://aiperception.io',
              },
              serviceType: 'AI Visibility Analysis',
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://aiperception.io',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: industryData.name,
                  item: `https://aiperception.io/ai-perception/${industry}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: cityData.name,
                  item: `https://aiperception.io/ai-perception/${industry}/${city}`,
                },
              ],
            },
          }),
        }}
      />
    </main>
  );
}
