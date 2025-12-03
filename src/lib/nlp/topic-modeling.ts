/**
 * Topic Modeling (BERTopic-inspired)
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Document clustering by topic
 * - TF-IDF based topic extraction
 * - Competitor mention clustering
 * - Topic coherence scoring
 * - Topic label generation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface Topic {
  id: number;
  label: string;
  keywords: string[];
  keywordScores: number[];
  documentCount: number;
  coherenceScore: number;
  representativeDoc?: string;
}

export interface DocumentTopicAssignment {
  documentId: string;
  topicId: number;
  probability: number;
}

export interface TopicModelResult {
  topics: Topic[];
  assignments: DocumentTopicAssignment[];
  outlierDocuments: string[];
  modelMetrics: {
    silhouetteScore: number;
    avgCoherence: number;
    topicDiversity: number;
  };
}

export interface CompetitorCluster {
  competitors: string[];
  context: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  frequency: number;
}

// ============================================================================
// TF-IDF IMPLEMENTATION
// ============================================================================

interface TermFrequency {
  term: string;
  count: number;
  tf: number;
}

interface TFIDF {
  term: string;
  tfidf: number;
  df: number;
}

/**
 * Calculate term frequency for a document
 */
function calculateTF(text: string, stopwords: Set<string>): TermFrequency[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  const totalTerms = words.length || 1;

  return Array.from(counts.entries()).map(([term, count]) => ({
    term,
    count,
    tf: count / totalTerms,
  }));
}

/**
 * Calculate document frequency across corpus
 */
function calculateDF(documents: string[], stopwords: Set<string>): Map<string, number> {
  const df = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTerms = new Set(
      doc.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w))
    );

    for (const term of uniqueTerms) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  return df;
}

/**
 * Calculate TF-IDF scores for a document
 */
function calculateTFIDF(tf: TermFrequency[], df: Map<string, number>, totalDocs: number): TFIDF[] {
  return tf.map(({ term, tf: tfScore }) => {
    const docFreq = df.get(term) || 1;
    const idf = Math.log(totalDocs / docFreq);
    return {
      term,
      tfidf: tfScore * idf,
      df: docFreq,
    };
  }).sort((a, b) => b.tfidf - a.tfidf);
}

// ============================================================================
// STOPWORDS
// ============================================================================

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'then', 'once', 'about', 'over', 'such', 'your',
  'our', 'their', 'its', 'my', 'his', 'her', 'any', 'into', 'after', 'before',
]);

// ============================================================================
// CLUSTERING (SIMPLIFIED K-MEANS)
// ============================================================================

interface DocumentVector {
  id: string;
  text: string;
  vector: Map<string, number>;
}

/**
 * Convert document to TF-IDF vector
 */
function documentToVector(text: string, df: Map<string, number>, totalDocs: number): Map<string, number> {
  const tf = calculateTF(text, STOPWORDS);
  const tfidf = calculateTFIDF(tf, df, totalDocs);

  const vector = new Map<string, number>();
  for (const { term, tfidf: score } of tfidf.slice(0, 100)) { // Top 100 terms
    vector.set(term, score);
  }

  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const [term, score] of v1) {
    const score2 = v2.get(term) || 0;
    dotProduct += score * score2;
    norm1 += score * score;
  }

  for (const score of v2.values()) {
    norm2 += score * score;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Simple K-Means clustering
 */
function kMeansClustering(
  documents: DocumentVector[],
  k: number,
  maxIterations: number = 20
): Map<number, string[]> {
  if (documents.length === 0 || k <= 0) {
    return new Map();
  }

  // Initialize centroids randomly
  const shuffled = [...documents].sort(() => Math.random() - 0.5);
  let centroids = shuffled.slice(0, Math.min(k, documents.length)).map(d => new Map(d.vector));

  let assignments = new Map<string, number>();

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign documents to nearest centroid
    const newAssignments = new Map<string, number>();

    for (const doc of documents) {
      let bestCluster = 0;
      let bestSimilarity = -1;

      for (let i = 0; i < centroids.length; i++) {
        const similarity = cosineSimilarity(doc.vector, centroids[i]);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = i;
        }
      }

      newAssignments.set(doc.id, bestCluster);
    }

    // Check for convergence
    let changed = false;
    for (const [id, cluster] of newAssignments) {
      if (assignments.get(id) !== cluster) {
        changed = true;
        break;
      }
    }

    assignments = newAssignments;

    if (!changed) break;

    // Recalculate centroids
    const clusterDocs = new Map<number, DocumentVector[]>();
    for (const doc of documents) {
      const cluster = assignments.get(doc.id) || 0;
      if (!clusterDocs.has(cluster)) {
        clusterDocs.set(cluster, []);
      }
      clusterDocs.get(cluster)!.push(doc);
    }

    centroids = [];
    for (let i = 0; i < k; i++) {
      const docs = clusterDocs.get(i) || [];
      if (docs.length === 0) {
        // Keep old centroid or pick random
        centroids.push(new Map());
        continue;
      }

      // Average vectors
      const avgVector = new Map<string, number>();
      for (const doc of docs) {
        for (const [term, score] of doc.vector) {
          avgVector.set(term, (avgVector.get(term) || 0) + score / docs.length);
        }
      }
      centroids.push(avgVector);
    }
  }

  // Group by cluster
  const clusters = new Map<number, string[]>();
  for (const [docId, clusterId] of assignments) {
    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, []);
    }
    clusters.get(clusterId)!.push(docId);
  }

  return clusters;
}

// ============================================================================
// TOPIC EXTRACTION
// ============================================================================

/**
 * Extract top keywords for a cluster
 */
function extractClusterKeywords(
  documents: Document[],
  df: Map<string, number>,
  topN: number = 10
): Array<{ term: string; score: number }> {
  // Combine all documents in cluster
  const combinedText = documents.map(d => d.text).join(' ');
  const tf = calculateTF(combinedText, STOPWORDS);
  const tfidf = calculateTFIDF(tf, df, documents.length);

  return tfidf.slice(0, topN).map(({ term, tfidf: score }) => ({
    term,
    score: Math.round(score * 1000) / 1000,
  }));
}

/**
 * Generate topic label from keywords
 */
function generateTopicLabel(keywords: string[]): string {
  if (keywords.length === 0) return 'Unknown Topic';

  // Take top 3 keywords, capitalize first letters
  const topKeywords = keywords.slice(0, 3)
    .map(k => k.charAt(0).toUpperCase() + k.slice(1));

  return topKeywords.join(' / ');
}

/**
 * Calculate topic coherence (simplified)
 */
function calculateCoherence(keywords: string[], documents: Document[]): number {
  if (keywords.length < 2 || documents.length === 0) return 0;

  // Co-occurrence based coherence
  let cooccurrences = 0;
  let pairs = 0;

  for (let i = 0; i < keywords.length - 1; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      pairs++;
      const w1 = keywords[i].toLowerCase();
      const w2 = keywords[j].toLowerCase();

      for (const doc of documents) {
        const text = doc.text.toLowerCase();
        if (text.includes(w1) && text.includes(w2)) {
          cooccurrences++;
          break;
        }
      }
    }
  }

  return pairs > 0 ? cooccurrences / pairs : 0;
}

// ============================================================================
// COMPETITOR CLUSTERING
// ============================================================================

// Known competitor/brand patterns
const COMPETITOR_PATTERNS = [
  /\b(Google|Microsoft|Apple|Amazon|Meta|Facebook|OpenAI|Anthropic)\b/gi,
  /\b(Salesforce|Oracle|SAP|IBM|Adobe|VMware|ServiceNow)\b/gi,
  /\b(Slack|Zoom|Teams|Notion|Asana|Trello|Monday)\b/gi,
  /\b(AWS|Azure|GCP|Vercel|Netlify|Heroku|DigitalOcean)\b/gi,
  /\b(ChatGPT|Claude|Bard|Gemini|GPT-4|Llama|Mistral)\b/gi,
];

/**
 * Extract competitor mentions from text
 */
function extractCompetitorMentions(text: string): string[] {
  const mentions = new Set<string>();

  for (const pattern of COMPETITOR_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      mentions.add(match[0]);
    }
  }

  return Array.from(mentions);
}

/**
 * Cluster competitor co-occurrences
 */
export function clusterCompetitorMentions(documents: Document[]): CompetitorCluster[] {
  const cooccurrences = new Map<string, { competitors: Set<string>; contexts: string[]; count: number }>();

  for (const doc of documents) {
    const competitors = extractCompetitorMentions(doc.text);

    if (competitors.length >= 2) {
      // Create pair key
      const key = [...competitors].sort().join('|');

      if (!cooccurrences.has(key)) {
        cooccurrences.set(key, {
          competitors: new Set(competitors),
          contexts: [],
          count: 0,
        });
      }

      const entry = cooccurrences.get(key)!;
      entry.contexts.push(doc.text.substring(0, 200));
      entry.count++;
    }
  }

  // Convert to clusters
  const clusters: CompetitorCluster[] = [];

  for (const [, data] of cooccurrences) {
    if (data.count >= 2) { // Minimum threshold
      clusters.push({
        competitors: Array.from(data.competitors),
        context: data.contexts[0], // Representative context
        sentiment: 'neutral', // Would need sentiment analysis
        frequency: data.count,
      });
    }
  }

  return clusters.sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// MAIN MODELING FUNCTION
// ============================================================================

/**
 * Build topic model from documents
 */
export function buildTopicModel(
  documents: Document[],
  options: {
    numTopics?: number;
    minClusterSize?: number;
    topKeywords?: number;
  } = {}
): TopicModelResult {
  const {
    numTopics = Math.min(10, Math.max(2, Math.floor(documents.length / 5))),
    minClusterSize = 2,
    topKeywords = 10,
  } = options;

  if (documents.length < minClusterSize) {
    return {
      topics: [],
      assignments: [],
      outlierDocuments: documents.map(d => d.id),
      modelMetrics: {
        silhouetteScore: 0,
        avgCoherence: 0,
        topicDiversity: 0,
      },
    };
  }

  // Calculate document frequency
  const texts = documents.map(d => d.text);
  const df = calculateDF(texts, STOPWORDS);

  // Convert documents to vectors
  const docVectors: DocumentVector[] = documents.map(doc => ({
    id: doc.id,
    text: doc.text,
    vector: documentToVector(doc.text, df, documents.length),
  }));

  // Cluster documents
  const clusters = kMeansClustering(docVectors, numTopics);

  // Build topics
  const topics: Topic[] = [];
  const assignments: DocumentTopicAssignment[] = [];
  const outlierDocuments: string[] = [];

  for (const [clusterId, docIds] of clusters) {
    const clusterDocs = documents.filter(d => docIds.includes(d.id));

    if (clusterDocs.length < minClusterSize) {
      outlierDocuments.push(...docIds);
      continue;
    }

    // Extract keywords
    const keywordData = extractClusterKeywords(clusterDocs, df, topKeywords);
    const keywords = keywordData.map(k => k.term);
    const keywordScores = keywordData.map(k => k.score);

    // Calculate coherence
    const coherence = calculateCoherence(keywords, clusterDocs);

    // Generate label
    const label = generateTopicLabel(keywords);

    topics.push({
      id: clusterId,
      label,
      keywords,
      keywordScores,
      documentCount: clusterDocs.length,
      coherenceScore: Math.round(coherence * 100) / 100,
      representativeDoc: clusterDocs[0]?.text.substring(0, 200),
    });

    // Add assignments
    for (const docId of docIds) {
      assignments.push({
        documentId: docId,
        topicId: clusterId,
        probability: 0.8, // Simplified - would need proper probability
      });
    }
  }

  // Calculate metrics
  const avgCoherence = topics.length > 0
    ? topics.reduce((sum, t) => sum + t.coherenceScore, 0) / topics.length
    : 0;

  // Topic diversity = unique keywords / total keywords
  const allKeywords = new Set(topics.flatMap(t => t.keywords));
  const topicDiversity = topics.length > 0
    ? allKeywords.size / (topics.length * topKeywords)
    : 0;

  return {
    topics: topics.sort((a, b) => b.documentCount - a.documentCount),
    assignments,
    outlierDocuments,
    modelMetrics: {
      silhouetteScore: 0.5, // Would need proper calculation
      avgCoherence: Math.round(avgCoherence * 100) / 100,
      topicDiversity: Math.round(topicDiversity * 100) / 100,
    },
  };
}

/**
 * Get topic summary for display
 */
export function getTopicSummary(result: TopicModelResult): string {
  const parts = [
    `${result.topics.length} topics identified`,
    `${result.assignments.length} documents assigned`,
    `${result.outlierDocuments.length} outliers`,
    `Coherence: ${(result.modelMetrics.avgCoherence * 100).toFixed(1)}%`,
  ];

  return parts.join(' | ');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  buildTopicModel,
  clusterCompetitorMentions,
  getTopicSummary,
};
