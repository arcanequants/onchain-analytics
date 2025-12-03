/**
 * Industry Knowledge Graph
 *
 * Phase 4, Week 8, Day 4
 * Build brand relationship graphs per industry
 */

// ================================================================
// TYPES
// ================================================================

export interface BrandNode {
  id: string;
  name: string;
  domain: string;
  industry: string;
  subIndustry?: string;
  tier: 'leader' | 'challenger' | 'niche' | 'emerging';
  aiPerceptionScore?: number;
  marketShare?: number;
  founded?: number;
  headquarters?: string;
  employees?: string;
  funding?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface BrandRelationship {
  source: string; // brand id
  target: string; // brand id
  type: RelationshipType;
  strength: number; // 0-1
  bidirectional: boolean;
  metadata?: Record<string, unknown>;
}

export type RelationshipType =
  | 'competes_with'
  | 'partners_with'
  | 'acquired_by'
  | 'acquires'
  | 'integrates_with'
  | 'alternative_to'
  | 'subsidiary_of'
  | 'spun_off_from'
  | 'invests_in'
  | 'uses_technology_from';

export interface IndustryGraph {
  industry: string;
  subIndustries: string[];
  nodes: BrandNode[];
  edges: BrandRelationship[];
  lastUpdated: string;
  version: string;
}

export interface GraphQuery {
  industry?: string;
  brandId?: string;
  brandName?: string;
  relationshipType?: RelationshipType;
  minScore?: number;
  tier?: BrandNode['tier'];
  limit?: number;
}

export interface GraphAnalytics {
  totalBrands: number;
  byTier: Record<BrandNode['tier'], number>;
  avgScore: number;
  topCompetitors: { brand: string; connections: number }[];
  centralityScores: { brand: string; score: number }[];
  clusters: { name: string; brands: string[] }[];
}

// ================================================================
// INDUSTRY DEFINITIONS
// ================================================================

export const INDUSTRY_TAXONOMY: Record<string, string[]> = {
  saas: [
    'project-management',
    'crm',
    'marketing-automation',
    'analytics',
    'communication',
    'hr-tech',
    'finance-software',
    'developer-tools',
    'security',
    'productivity',
  ],
  ecommerce: [
    'marketplace',
    'direct-to-consumer',
    'b2b-ecommerce',
    'dropshipping',
    'subscription-commerce',
    'social-commerce',
  ],
  fintech: [
    'payments',
    'lending',
    'banking',
    'insurance-tech',
    'wealth-management',
    'crypto',
    'regtech',
    'embedded-finance',
  ],
  healthcare: [
    'telehealth',
    'health-records',
    'diagnostics',
    'pharma-tech',
    'mental-health',
    'fitness-wellness',
    'medical-devices',
  ],
  education: [
    'edtech',
    'online-courses',
    'learning-management',
    'tutoring',
    'corporate-training',
    'language-learning',
  ],
  cybersecurity: [
    'endpoint-security',
    'network-security',
    'identity-access',
    'cloud-security',
    'threat-intelligence',
    'compliance',
  ],
  marketing: [
    'advertising',
    'seo-tools',
    'social-media',
    'email-marketing',
    'content-marketing',
    'influencer-marketing',
  ],
};

// ================================================================
// KNOWLEDGE GRAPH CLASS
// ================================================================

export class IndustryKnowledgeGraph {
  private graphs: Map<string, IndustryGraph> = new Map();

  constructor() {
    this.initializeBaseGraphs();
  }

  /**
   * Initialize base graphs with known industry data
   */
  private initializeBaseGraphs(): void {
    // Initialize each industry with empty structure
    for (const industry of Object.keys(INDUSTRY_TAXONOMY)) {
      this.graphs.set(industry, {
        industry,
        subIndustries: INDUSTRY_TAXONOMY[industry],
        nodes: [],
        edges: [],
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
      });
    }

    // Seed with known brands (example data)
    this.seedSaaSGraph();
    this.seedFintechGraph();
    this.seedCybersecurityGraph();
  }

  /**
   * Seed SaaS industry graph with known brands
   */
  private seedSaaSGraph(): void {
    const saasGraph = this.graphs.get('saas')!;

    const brands: BrandNode[] = [
      {
        id: 'salesforce',
        name: 'Salesforce',
        domain: 'salesforce.com',
        industry: 'saas',
        subIndustry: 'crm',
        tier: 'leader',
        aiPerceptionScore: 92,
        founded: 1999,
        headquarters: 'San Francisco, CA',
        employees: '70,000+',
        attributes: { publiclyTraded: true, marketCap: '200B+' },
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        domain: 'hubspot.com',
        industry: 'saas',
        subIndustry: 'crm',
        tier: 'leader',
        aiPerceptionScore: 88,
        founded: 2006,
        headquarters: 'Cambridge, MA',
        employees: '7,000+',
        attributes: { publiclyTraded: true, focus: 'inbound-marketing' },
      },
      {
        id: 'slack',
        name: 'Slack',
        domain: 'slack.com',
        industry: 'saas',
        subIndustry: 'communication',
        tier: 'leader',
        aiPerceptionScore: 90,
        founded: 2009,
        headquarters: 'San Francisco, CA',
        attributes: { acquiredBy: 'Salesforce', acquisitionYear: 2021 },
      },
      {
        id: 'notion',
        name: 'Notion',
        domain: 'notion.so',
        industry: 'saas',
        subIndustry: 'productivity',
        tier: 'challenger',
        aiPerceptionScore: 85,
        founded: 2013,
        headquarters: 'San Francisco, CA',
        attributes: { category: 'all-in-one-workspace' },
      },
      {
        id: 'asana',
        name: 'Asana',
        domain: 'asana.com',
        industry: 'saas',
        subIndustry: 'project-management',
        tier: 'leader',
        aiPerceptionScore: 82,
        founded: 2008,
        headquarters: 'San Francisco, CA',
        attributes: { publiclyTraded: true },
      },
      {
        id: 'monday',
        name: 'Monday.com',
        domain: 'monday.com',
        industry: 'saas',
        subIndustry: 'project-management',
        tier: 'leader',
        aiPerceptionScore: 80,
        founded: 2012,
        headquarters: 'Tel Aviv, Israel',
        attributes: { publiclyTraded: true },
      },
      {
        id: 'airtable',
        name: 'Airtable',
        domain: 'airtable.com',
        industry: 'saas',
        subIndustry: 'productivity',
        tier: 'challenger',
        aiPerceptionScore: 78,
        founded: 2012,
        headquarters: 'San Francisco, CA',
        attributes: { category: 'spreadsheet-database' },
      },
      {
        id: 'figma',
        name: 'Figma',
        domain: 'figma.com',
        industry: 'saas',
        subIndustry: 'developer-tools',
        tier: 'leader',
        aiPerceptionScore: 91,
        founded: 2012,
        headquarters: 'San Francisco, CA',
        attributes: { category: 'design-collaboration' },
      },
    ];

    saasGraph.nodes = brands;

    // Define relationships
    saasGraph.edges = [
      { source: 'salesforce', target: 'hubspot', type: 'competes_with', strength: 0.9, bidirectional: true },
      { source: 'salesforce', target: 'slack', type: 'acquires', strength: 1.0, bidirectional: false },
      { source: 'slack', target: 'salesforce', type: 'acquired_by', strength: 1.0, bidirectional: false },
      { source: 'notion', target: 'airtable', type: 'competes_with', strength: 0.7, bidirectional: true },
      { source: 'asana', target: 'monday', type: 'competes_with', strength: 0.95, bidirectional: true },
      { source: 'notion', target: 'asana', type: 'competes_with', strength: 0.6, bidirectional: true },
      { source: 'slack', target: 'notion', type: 'integrates_with', strength: 0.8, bidirectional: true },
      { source: 'figma', target: 'notion', type: 'integrates_with', strength: 0.7, bidirectional: true },
    ];

    this.graphs.set('saas', saasGraph);
  }

  /**
   * Seed Fintech industry graph
   */
  private seedFintechGraph(): void {
    const fintechGraph = this.graphs.get('fintech')!;

    const brands: BrandNode[] = [
      {
        id: 'stripe',
        name: 'Stripe',
        domain: 'stripe.com',
        industry: 'fintech',
        subIndustry: 'payments',
        tier: 'leader',
        aiPerceptionScore: 94,
        founded: 2010,
        headquarters: 'San Francisco, CA',
        attributes: { valuation: '50B+', category: 'payment-infrastructure' },
      },
      {
        id: 'plaid',
        name: 'Plaid',
        domain: 'plaid.com',
        industry: 'fintech',
        subIndustry: 'banking',
        tier: 'leader',
        aiPerceptionScore: 86,
        founded: 2013,
        headquarters: 'San Francisco, CA',
        attributes: { category: 'financial-data-connectivity' },
      },
      {
        id: 'square',
        name: 'Square (Block)',
        domain: 'squareup.com',
        industry: 'fintech',
        subIndustry: 'payments',
        tier: 'leader',
        aiPerceptionScore: 88,
        founded: 2009,
        headquarters: 'San Francisco, CA',
        attributes: { publiclyTraded: true, renamedTo: 'Block' },
      },
      {
        id: 'brex',
        name: 'Brex',
        domain: 'brex.com',
        industry: 'fintech',
        subIndustry: 'banking',
        tier: 'challenger',
        aiPerceptionScore: 75,
        founded: 2017,
        headquarters: 'San Francisco, CA',
        attributes: { category: 'corporate-cards' },
      },
      {
        id: 'ramp',
        name: 'Ramp',
        domain: 'ramp.com',
        industry: 'fintech',
        subIndustry: 'banking',
        tier: 'challenger',
        aiPerceptionScore: 78,
        founded: 2019,
        headquarters: 'New York, NY',
        attributes: { category: 'corporate-cards-expense' },
      },
    ];

    fintechGraph.nodes = brands;

    fintechGraph.edges = [
      { source: 'stripe', target: 'square', type: 'competes_with', strength: 0.85, bidirectional: true },
      { source: 'stripe', target: 'plaid', type: 'integrates_with', strength: 0.9, bidirectional: true },
      { source: 'brex', target: 'ramp', type: 'competes_with', strength: 0.95, bidirectional: true },
      { source: 'brex', target: 'stripe', type: 'uses_technology_from', strength: 0.8, bidirectional: false },
      { source: 'ramp', target: 'stripe', type: 'uses_technology_from', strength: 0.8, bidirectional: false },
    ];

    this.graphs.set('fintech', fintechGraph);
  }

  /**
   * Seed Cybersecurity industry graph
   */
  private seedCybersecurityGraph(): void {
    const cyberGraph = this.graphs.get('cybersecurity')!;

    const brands: BrandNode[] = [
      {
        id: 'crowdstrike',
        name: 'CrowdStrike',
        domain: 'crowdstrike.com',
        industry: 'cybersecurity',
        subIndustry: 'endpoint-security',
        tier: 'leader',
        aiPerceptionScore: 90,
        founded: 2011,
        headquarters: 'Austin, TX',
        attributes: { publiclyTraded: true },
      },
      {
        id: 'palo-alto',
        name: 'Palo Alto Networks',
        domain: 'paloaltonetworks.com',
        industry: 'cybersecurity',
        subIndustry: 'network-security',
        tier: 'leader',
        aiPerceptionScore: 88,
        founded: 2005,
        headquarters: 'Santa Clara, CA',
        attributes: { publiclyTraded: true },
      },
      {
        id: 'okta',
        name: 'Okta',
        domain: 'okta.com',
        industry: 'cybersecurity',
        subIndustry: 'identity-access',
        tier: 'leader',
        aiPerceptionScore: 85,
        founded: 2009,
        headquarters: 'San Francisco, CA',
        attributes: { publiclyTraded: true },
      },
      {
        id: 'zscaler',
        name: 'Zscaler',
        domain: 'zscaler.com',
        industry: 'cybersecurity',
        subIndustry: 'cloud-security',
        tier: 'leader',
        aiPerceptionScore: 82,
        founded: 2007,
        headquarters: 'San Jose, CA',
        attributes: { publiclyTraded: true, category: 'zero-trust' },
      },
      {
        id: 'sentinelone',
        name: 'SentinelOne',
        domain: 'sentinelone.com',
        industry: 'cybersecurity',
        subIndustry: 'endpoint-security',
        tier: 'challenger',
        aiPerceptionScore: 79,
        founded: 2013,
        headquarters: 'Mountain View, CA',
        attributes: { publiclyTraded: true },
      },
    ];

    cyberGraph.nodes = brands;

    cyberGraph.edges = [
      { source: 'crowdstrike', target: 'sentinelone', type: 'competes_with', strength: 0.95, bidirectional: true },
      { source: 'okta', target: 'crowdstrike', type: 'integrates_with', strength: 0.8, bidirectional: true },
      { source: 'palo-alto', target: 'zscaler', type: 'competes_with', strength: 0.7, bidirectional: true },
      { source: 'okta', target: 'zscaler', type: 'integrates_with', strength: 0.85, bidirectional: true },
    ];

    this.graphs.set('cybersecurity', cyberGraph);
  }

  // ================================================================
  // QUERY METHODS
  // ================================================================

  /**
   * Get full industry graph
   */
  getGraph(industry: string): IndustryGraph | null {
    return this.graphs.get(industry) || null;
  }

  /**
   * Get all industries
   */
  getIndustries(): string[] {
    return Array.from(this.graphs.keys());
  }

  /**
   * Find brand by ID or name
   */
  findBrand(query: { id?: string; name?: string; domain?: string }): BrandNode | null {
    for (const graph of this.graphs.values()) {
      const found = graph.nodes.find(
        (n) =>
          n.id === query.id ||
          n.name.toLowerCase() === query.name?.toLowerCase() ||
          n.domain === query.domain
      );
      if (found) return found;
    }
    return null;
  }

  /**
   * Get competitors for a brand
   */
  getCompetitors(brandId: string): BrandNode[] {
    const competitors: BrandNode[] = [];

    for (const graph of this.graphs.values()) {
      const edges = graph.edges.filter(
        (e) =>
          (e.source === brandId || e.target === brandId) &&
          (e.type === 'competes_with' || e.type === 'alternative_to')
      );

      for (const edge of edges) {
        const competitorId = edge.source === brandId ? edge.target : edge.source;
        const competitor = graph.nodes.find((n) => n.id === competitorId);
        if (competitor && !competitors.find((c) => c.id === competitor.id)) {
          competitors.push(competitor);
        }
      }
    }

    return competitors.sort((a, b) => (b.aiPerceptionScore || 0) - (a.aiPerceptionScore || 0));
  }

  /**
   * Get brands that integrate with a brand
   */
  getIntegrations(brandId: string): BrandNode[] {
    const integrations: BrandNode[] = [];

    for (const graph of this.graphs.values()) {
      const edges = graph.edges.filter(
        (e) =>
          (e.source === brandId || e.target === brandId) && e.type === 'integrates_with'
      );

      for (const edge of edges) {
        const partnerId = edge.source === brandId ? edge.target : edge.source;
        const partner = graph.nodes.find((n) => n.id === partnerId);
        if (partner && !integrations.find((i) => i.id === partner.id)) {
          integrations.push(partner);
        }
      }
    }

    return integrations;
  }

  /**
   * Get brands by tier in an industry
   */
  getBrandsByTier(industry: string, tier: BrandNode['tier']): BrandNode[] {
    const graph = this.graphs.get(industry);
    if (!graph) return [];

    return graph.nodes
      .filter((n) => n.tier === tier)
      .sort((a, b) => (b.aiPerceptionScore || 0) - (a.aiPerceptionScore || 0));
  }

  /**
   * Search brands across all industries
   */
  searchBrands(query: GraphQuery): BrandNode[] {
    let results: BrandNode[] = [];

    const graphsToSearch = query.industry
      ? [this.graphs.get(query.industry)].filter(Boolean) as IndustryGraph[]
      : Array.from(this.graphs.values());

    for (const graph of graphsToSearch) {
      let filtered = graph.nodes;

      if (query.brandName) {
        const searchTerm = query.brandName.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.name.toLowerCase().includes(searchTerm) ||
            n.domain.toLowerCase().includes(searchTerm)
        );
      }

      if (query.tier) {
        filtered = filtered.filter((n) => n.tier === query.tier);
      }

      if (query.minScore !== undefined) {
        filtered = filtered.filter(
          (n) => (n.aiPerceptionScore || 0) >= query.minScore!
        );
      }

      results = results.concat(filtered);
    }

    // Sort by AI perception score
    results.sort((a, b) => (b.aiPerceptionScore || 0) - (a.aiPerceptionScore || 0));

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // ================================================================
  // ANALYTICS METHODS
  // ================================================================

  /**
   * Get analytics for an industry graph
   */
  getIndustryAnalytics(industry: string): GraphAnalytics | null {
    const graph = this.graphs.get(industry);
    if (!graph) return null;

    // Count by tier
    const byTier: Record<BrandNode['tier'], number> = {
      leader: 0,
      challenger: 0,
      niche: 0,
      emerging: 0,
    };
    for (const node of graph.nodes) {
      byTier[node.tier]++;
    }

    // Calculate average score
    const scores = graph.nodes
      .filter((n) => n.aiPerceptionScore !== undefined)
      .map((n) => n.aiPerceptionScore!);
    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Count connections per brand
    const connectionCount: Record<string, number> = {};
    for (const edge of graph.edges) {
      connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1;
      if (edge.bidirectional) {
        connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1;
      }
    }

    // Top competitors by connections
    const topCompetitors = Object.entries(connectionCount)
      .map(([brand, connections]) => ({ brand, connections }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // Simple centrality (degree centrality)
    const centralityScores = Object.entries(connectionCount)
      .map(([brand, connections]) => ({
        brand,
        score: connections / (graph.nodes.length - 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Simple clustering by sub-industry
    const clusters: { name: string; brands: string[] }[] = [];
    const subIndustryMap: Record<string, string[]> = {};
    for (const node of graph.nodes) {
      if (node.subIndustry) {
        if (!subIndustryMap[node.subIndustry]) {
          subIndustryMap[node.subIndustry] = [];
        }
        subIndustryMap[node.subIndustry].push(node.name);
      }
    }
    for (const [name, brands] of Object.entries(subIndustryMap)) {
      clusters.push({ name, brands });
    }

    return {
      totalBrands: graph.nodes.length,
      byTier,
      avgScore: Math.round(avgScore * 10) / 10,
      topCompetitors,
      centralityScores,
      clusters,
    };
  }

  // ================================================================
  // MUTATION METHODS
  // ================================================================

  /**
   * Add a brand to the graph
   */
  addBrand(brand: BrandNode): void {
    const graph = this.graphs.get(brand.industry);
    if (!graph) {
      throw new Error(`Unknown industry: ${brand.industry}`);
    }

    // Check for duplicates
    if (graph.nodes.find((n) => n.id === brand.id)) {
      throw new Error(`Brand already exists: ${brand.id}`);
    }

    graph.nodes.push(brand);
    graph.lastUpdated = new Date().toISOString();
  }

  /**
   * Add a relationship between brands
   */
  addRelationship(relationship: BrandRelationship): void {
    // Find which graph contains the source brand
    for (const graph of this.graphs.values()) {
      if (graph.nodes.find((n) => n.id === relationship.source)) {
        // Check target exists somewhere
        const targetExists = Array.from(this.graphs.values()).some((g) =>
          g.nodes.find((n) => n.id === relationship.target)
        );

        if (!targetExists) {
          throw new Error(`Target brand not found: ${relationship.target}`);
        }

        graph.edges.push(relationship);
        graph.lastUpdated = new Date().toISOString();
        return;
      }
    }

    throw new Error(`Source brand not found: ${relationship.source}`);
  }

  /**
   * Update brand score
   */
  updateBrandScore(brandId: string, score: number): void {
    for (const graph of this.graphs.values()) {
      const brand = graph.nodes.find((n) => n.id === brandId);
      if (brand) {
        brand.aiPerceptionScore = score;
        graph.lastUpdated = new Date().toISOString();
        return;
      }
    }
    throw new Error(`Brand not found: ${brandId}`);
  }

  // ================================================================
  // EXPORT METHODS
  // ================================================================

  /**
   * Export graph to JSON-LD format
   */
  toJsonLd(industry: string): object | null {
    const graph = this.graphs.get(industry);
    if (!graph) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${industry.toUpperCase()} Industry Brands`,
      numberOfItems: graph.nodes.length,
      itemListElement: graph.nodes.map((node, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Organization',
          name: node.name,
          url: `https://${node.domain}`,
          foundingDate: node.founded?.toString(),
          location: node.headquarters,
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'aiPerceptionScore',
            value: node.aiPerceptionScore,
          },
        },
      })),
    };
  }

  /**
   * Export graph for visualization (D3/vis.js compatible)
   */
  toVisualizationFormat(industry: string): { nodes: object[]; links: object[] } | null {
    const graph = this.graphs.get(industry);
    if (!graph) return null;

    return {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        label: n.name,
        group: n.subIndustry || 'general',
        size: n.tier === 'leader' ? 30 : n.tier === 'challenger' ? 20 : 10,
        score: n.aiPerceptionScore,
      })),
      links: graph.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        value: e.strength,
      })),
    };
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let graphInstance: IndustryKnowledgeGraph | null = null;

export function getIndustryGraph(): IndustryKnowledgeGraph {
  if (!graphInstance) {
    graphInstance = new IndustryKnowledgeGraph();
  }
  return graphInstance;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  IndustryKnowledgeGraph,
  getIndustryGraph,
  INDUSTRY_TAXONOMY,
};
