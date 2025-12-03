/**
 * Embedding Store (pgvector)
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Vector storage with pgvector
 * - Similarity search (cosine, L2, inner product)
 * - Batch operations
 * - Index management (IVFFlat, HNSW)
 * - Metadata filtering
 */

// ============================================================================
// TYPES
// ============================================================================

export type DistanceMetric = 'cosine' | 'l2' | 'inner_product';
export type IndexType = 'ivfflat' | 'hnsw' | 'none';

export interface EmbeddingVector {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
  namespace?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmbeddingInput {
  id?: string;
  vector: number[];
  metadata?: Record<string, unknown>;
  namespace?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  distance: number;
  vector: number[];
  metadata: Record<string, unknown>;
}

export interface SearchOptions {
  topK?: number;
  namespace?: string;
  filter?: MetadataFilter;
  includeVectors?: boolean;
  minScore?: number;
}

export interface MetadataFilter {
  [key: string]: unknown | MetadataFilterOp;
}

export interface MetadataFilterOp {
  $eq?: unknown;
  $ne?: unknown;
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $in?: unknown[];
  $nin?: unknown[];
  $exists?: boolean;
}

export interface StoreConfig {
  dimensions: number;
  metric: DistanceMetric;
  indexType: IndexType;
  tableName?: string;
  // IVFFlat options
  ivfLists?: number;
  // HNSW options
  hnswM?: number;
  hnswEfConstruction?: number;
}

export interface IndexStats {
  totalVectors: number;
  dimensions: number;
  indexType: IndexType;
  metric: DistanceMetric;
  namespaces: Record<string, number>;
  sizeBytes: number;
  lastUpdated: Date;
}

// ============================================================================
// IN-MEMORY STORE (Development/Testing)
// ============================================================================

class InMemoryEmbeddingStore {
  private vectors: Map<string, EmbeddingVector> = new Map();
  private config: StoreConfig;

  constructor(config: StoreConfig) {
    this.config = config;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `emb_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Validate vector dimensions
   */
  private validateVector(vector: number[]): void {
    if (vector.length !== this.config.dimensions) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.config.dimensions}, got ${vector.length}`
      );
    }
  }

  /**
   * Calculate distance between vectors
   */
  private calculateDistance(a: number[], b: number[]): number {
    switch (this.config.metric) {
      case 'cosine':
        return this.cosineDistance(a, b);
      case 'l2':
        return this.l2Distance(a, b);
      case 'inner_product':
        return -this.dotProduct(a, b); // Negative for similarity ordering
      default:
        return this.cosineDistance(a, b);
    }
  }

  private cosineDistance(a: number[], b: number[]): number {
    const dot = this.dotProduct(a, b);
    const normA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
    const normB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
    return 1 - (dot / (normA * normB));
  }

  private l2Distance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, x, i) => sum + Math.pow(x - b[i], 2), 0)
    );
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, x, i) => sum + x * b[i], 0);
  }

  /**
   * Convert distance to similarity score (0-1)
   */
  private distanceToScore(distance: number): number {
    switch (this.config.metric) {
      case 'cosine':
        return 1 - distance;
      case 'l2':
        return 1 / (1 + distance);
      case 'inner_product':
        return -distance; // Already similarity
      default:
        return 1 - distance;
    }
  }

  /**
   * Check if metadata matches filter
   */
  private matchesFilter(metadata: Record<string, unknown>, filter: MetadataFilter): boolean {
    for (const [key, condition] of Object.entries(filter)) {
      const value = metadata[key];

      if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
        const ops = condition as MetadataFilterOp;

        if (ops.$eq !== undefined && value !== ops.$eq) return false;
        if (ops.$ne !== undefined && value === ops.$ne) return false;
        if (ops.$gt !== undefined && (typeof value !== 'number' || value <= ops.$gt)) return false;
        if (ops.$gte !== undefined && (typeof value !== 'number' || value < ops.$gte)) return false;
        if (ops.$lt !== undefined && (typeof value !== 'number' || value >= ops.$lt)) return false;
        if (ops.$lte !== undefined && (typeof value !== 'number' || value > ops.$lte)) return false;
        if (ops.$in !== undefined && !ops.$in.includes(value)) return false;
        if (ops.$nin !== undefined && ops.$nin.includes(value)) return false;
        if (ops.$exists !== undefined && (value !== undefined) !== ops.$exists) return false;
      } else {
        // Direct equality
        if (value !== condition) return false;
      }
    }
    return true;
  }

  /**
   * Insert single vector
   */
  async upsert(input: EmbeddingInput): Promise<EmbeddingVector> {
    this.validateVector(input.vector);

    const id = input.id || this.generateId();
    const existing = this.vectors.get(id);

    const embedding: EmbeddingVector = {
      id,
      vector: input.vector,
      metadata: input.metadata || {},
      namespace: input.namespace,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.vectors.set(id, embedding);
    return embedding;
  }

  /**
   * Batch insert vectors
   */
  async upsertBatch(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]> {
    return Promise.all(inputs.map(input => this.upsert(input)));
  }

  /**
   * Get vector by ID
   */
  async get(id: string): Promise<EmbeddingVector | null> {
    return this.vectors.get(id) || null;
  }

  /**
   * Get multiple vectors by ID
   */
  async getBatch(ids: string[]): Promise<(EmbeddingVector | null)[]> {
    return ids.map(id => this.vectors.get(id) || null);
  }

  /**
   * Delete vector by ID
   */
  async delete(id: string): Promise<boolean> {
    return this.vectors.delete(id);
  }

  /**
   * Delete multiple vectors by ID
   */
  async deleteBatch(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (this.vectors.delete(id)) count++;
    }
    return count;
  }

  /**
   * Delete all vectors in namespace
   */
  async deleteNamespace(namespace: string): Promise<number> {
    let count = 0;
    for (const [id, embedding] of this.vectors.entries()) {
      if (embedding.namespace === namespace) {
        this.vectors.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Similarity search
   */
  async search(queryVector: number[], options: SearchOptions = {}): Promise<SearchResult[]> {
    this.validateVector(queryVector);

    const { topK = 10, namespace, filter, includeVectors = false, minScore } = options;

    // Filter candidates
    const candidates: Array<{ embedding: EmbeddingVector; distance: number }> = [];

    for (const embedding of this.vectors.values()) {
      // Namespace filter
      if (namespace !== undefined && embedding.namespace !== namespace) continue;

      // Metadata filter
      if (filter && !this.matchesFilter(embedding.metadata, filter)) continue;

      const distance = this.calculateDistance(queryVector, embedding.vector);
      candidates.push({ embedding, distance });
    }

    // Sort by distance (ascending)
    candidates.sort((a, b) => a.distance - b.distance);

    // Apply topK and minScore
    const results: SearchResult[] = [];
    for (const candidate of candidates.slice(0, topK)) {
      const score = this.distanceToScore(candidate.distance);

      if (minScore !== undefined && score < minScore) continue;

      results.push({
        id: candidate.embedding.id,
        score,
        distance: candidate.distance,
        vector: includeVectors ? candidate.embedding.vector : [],
        metadata: candidate.embedding.metadata,
      });
    }

    return results;
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<IndexStats> {
    const namespaces: Record<string, number> = {};

    for (const embedding of this.vectors.values()) {
      const ns = embedding.namespace || 'default';
      namespaces[ns] = (namespaces[ns] || 0) + 1;
    }

    // Estimate size (8 bytes per float64)
    const vectorBytes = this.vectors.size * this.config.dimensions * 8;
    const metadataBytes = [...this.vectors.values()].reduce(
      (sum, e) => sum + JSON.stringify(e.metadata).length * 2,
      0
    );

    return {
      totalVectors: this.vectors.size,
      dimensions: this.config.dimensions,
      indexType: this.config.indexType,
      metric: this.config.metric,
      namespaces,
      sizeBytes: vectorBytes + metadataBytes,
      lastUpdated: new Date(),
    };
  }

  /**
   * Clear all vectors
   */
  async clear(): Promise<void> {
    this.vectors.clear();
  }
}

// ============================================================================
// PGVECTOR SQL GENERATOR
// ============================================================================

/**
 * Generate SQL for pgvector operations
 * These can be used with any PostgreSQL client (pg, supabase, etc.)
 */
export const pgvectorSQL = {
  /**
   * Enable pgvector extension
   */
  enableExtension(): string {
    return 'CREATE EXTENSION IF NOT EXISTS vector;';
  },

  /**
   * Create embeddings table
   */
  createTable(config: StoreConfig): string {
    const tableName = config.tableName || 'embeddings';
    return `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        vector vector(${config.dimensions}),
        metadata JSONB DEFAULT '{}',
        namespace TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_${tableName}_namespace
        ON ${tableName} (namespace);

      CREATE INDEX IF NOT EXISTS idx_${tableName}_metadata
        ON ${tableName} USING GIN (metadata);
    `;
  },

  /**
   * Create vector index
   */
  createIndex(config: StoreConfig): string {
    const tableName = config.tableName || 'embeddings';
    const operator = config.metric === 'cosine' ? 'vector_cosine_ops'
      : config.metric === 'l2' ? 'vector_l2_ops'
      : 'vector_ip_ops';

    if (config.indexType === 'ivfflat') {
      const lists = config.ivfLists || Math.ceil(Math.sqrt(1000));
      return `
        CREATE INDEX IF NOT EXISTS idx_${tableName}_vector_ivfflat
          ON ${tableName} USING ivfflat (vector ${operator})
          WITH (lists = ${lists});
      `;
    }

    if (config.indexType === 'hnsw') {
      const m = config.hnswM || 16;
      const efConstruction = config.hnswEfConstruction || 64;
      return `
        CREATE INDEX IF NOT EXISTS idx_${tableName}_vector_hnsw
          ON ${tableName} USING hnsw (vector ${operator})
          WITH (m = ${m}, ef_construction = ${efConstruction});
      `;
    }

    return '-- No index specified';
  },

  /**
   * Upsert vector
   */
  upsert(tableName: string = 'embeddings'): string {
    return `
      INSERT INTO ${tableName} (id, vector, metadata, namespace, updated_at)
      VALUES ($1, $2::vector, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        vector = EXCLUDED.vector,
        metadata = EXCLUDED.metadata,
        namespace = EXCLUDED.namespace,
        updated_at = NOW()
      RETURNING *;
    `;
  },

  /**
   * Batch upsert
   */
  upsertBatch(tableName: string = 'embeddings', count: number): string {
    const values = Array.from({ length: count }, (_, i) => {
      const offset = i * 4;
      return `($${offset + 1}, $${offset + 2}::vector, $${offset + 3}, $${offset + 4}, NOW())`;
    }).join(', ');

    return `
      INSERT INTO ${tableName} (id, vector, metadata, namespace, updated_at)
      VALUES ${values}
      ON CONFLICT (id) DO UPDATE SET
        vector = EXCLUDED.vector,
        metadata = EXCLUDED.metadata,
        namespace = EXCLUDED.namespace,
        updated_at = NOW()
      RETURNING *;
    `;
  },

  /**
   * Similarity search
   */
  search(config: StoreConfig): string {
    const tableName = config.tableName || 'embeddings';
    const distanceOp = config.metric === 'cosine' ? '<=>'
      : config.metric === 'l2' ? '<->'
      : '<#>';

    return `
      SELECT
        id,
        vector::text,
        metadata,
        namespace,
        created_at,
        updated_at,
        vector ${distanceOp} $1::vector AS distance
      FROM ${tableName}
      WHERE ($2::text IS NULL OR namespace = $2)
      ORDER BY vector ${distanceOp} $1::vector
      LIMIT $3;
    `;
  },

  /**
   * Search with metadata filter
   */
  searchWithFilter(config: StoreConfig, filterExpr: string): string {
    const tableName = config.tableName || 'embeddings';
    const distanceOp = config.metric === 'cosine' ? '<=>'
      : config.metric === 'l2' ? '<->'
      : '<#>';

    return `
      SELECT
        id,
        vector::text,
        metadata,
        namespace,
        created_at,
        updated_at,
        vector ${distanceOp} $1::vector AS distance
      FROM ${tableName}
      WHERE ($2::text IS NULL OR namespace = $2)
        AND (${filterExpr})
      ORDER BY vector ${distanceOp} $1::vector
      LIMIT $3;
    `;
  },

  /**
   * Delete by ID
   */
  delete(tableName: string = 'embeddings'): string {
    return `DELETE FROM ${tableName} WHERE id = $1 RETURNING id;`;
  },

  /**
   * Delete by namespace
   */
  deleteNamespace(tableName: string = 'embeddings'): string {
    return `DELETE FROM ${tableName} WHERE namespace = $1 RETURNING id;`;
  },

  /**
   * Get stats
   */
  getStats(tableName: string = 'embeddings'): string {
    return `
      SELECT
        COUNT(*) as total_vectors,
        namespace,
        pg_total_relation_size('${tableName}') as size_bytes
      FROM ${tableName}
      GROUP BY namespace;
    `;
  },

  /**
   * Convert metadata filter to SQL
   */
  filterToSQL(filter: MetadataFilter): { sql: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 4; // Start after search params

    for (const [key, condition] of Object.entries(filter)) {
      if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
        const ops = condition as MetadataFilterOp;

        if (ops.$eq !== undefined) {
          conditions.push(`metadata->>'${key}' = $${paramIndex++}`);
          params.push(String(ops.$eq));
        }
        if (ops.$ne !== undefined) {
          conditions.push(`metadata->>'${key}' != $${paramIndex++}`);
          params.push(String(ops.$ne));
        }
        if (ops.$gt !== undefined) {
          conditions.push(`(metadata->>'${key}')::numeric > $${paramIndex++}`);
          params.push(ops.$gt);
        }
        if (ops.$gte !== undefined) {
          conditions.push(`(metadata->>'${key}')::numeric >= $${paramIndex++}`);
          params.push(ops.$gte);
        }
        if (ops.$lt !== undefined) {
          conditions.push(`(metadata->>'${key}')::numeric < $${paramIndex++}`);
          params.push(ops.$lt);
        }
        if (ops.$lte !== undefined) {
          conditions.push(`(metadata->>'${key}')::numeric <= $${paramIndex++}`);
          params.push(ops.$lte);
        }
        if (ops.$in !== undefined) {
          conditions.push(`metadata->>'${key}' = ANY($${paramIndex++})`);
          params.push(ops.$in.map(String));
        }
        if (ops.$nin !== undefined) {
          conditions.push(`NOT (metadata->>'${key}' = ANY($${paramIndex++}))`);
          params.push(ops.$nin.map(String));
        }
        if (ops.$exists !== undefined) {
          conditions.push(ops.$exists
            ? `metadata ? '${key}'`
            : `NOT metadata ? '${key}'`
          );
        }
      } else {
        conditions.push(`metadata->>'${key}' = $${paramIndex++}`);
        params.push(String(condition));
      }
    }

    return {
      sql: conditions.length > 0 ? conditions.join(' AND ') : 'TRUE',
      params,
    };
  },
};

// ============================================================================
// EMBEDDING UTILITIES
// ============================================================================

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  if (magnitude === 0) return vector;
  return vector.map(x => x / magnitude);
}

/**
 * Calculate centroid of multiple vectors
 */
export function calculateCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];

  const dimensions = vectors[0].length;
  const centroid = new Array(dimensions).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += vector[i];
    }
  }

  return centroid.map(x => x / vectors.length);
}

/**
 * Reduce vector dimensions using random projection
 */
export function randomProjection(
  vector: number[],
  targetDimensions: number,
  seed?: number
): number[] {
  const random = createSeededRandom(seed || 42);
  const result = new Array(targetDimensions).fill(0);

  for (let i = 0; i < targetDimensions; i++) {
    for (let j = 0; j < vector.length; j++) {
      // Sparse random projection
      const r = random();
      const projection = r < 1/6 ? 1 : r > 5/6 ? -1 : 0;
      result[i] += projection * vector[j];
    }
    result[i] *= Math.sqrt(3 / vector.length);
  }

  return result;
}

function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.sin(s * 9999) * 10000;
    return s - Math.floor(s);
  };
}

/**
 * Quantize vector to reduce memory usage
 */
export function quantizeVector(
  vector: number[],
  bits: 8 | 16 = 8
): { quantized: number[]; min: number; scale: number } {
  const min = Math.min(...vector);
  const max = Math.max(...vector);
  const range = max - min || 1;
  const maxValue = bits === 8 ? 255 : 65535;
  const scale = range / maxValue;

  const quantized = vector.map(x =>
    Math.round((x - min) / scale)
  );

  return { quantized, min, scale };
}

/**
 * Dequantize vector
 */
export function dequantizeVector(
  quantized: number[],
  min: number,
  scale: number
): number[] {
  return quantized.map(x => x * scale + min);
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultStore: InMemoryEmbeddingStore | null = null;

/**
 * Create embedding store
 */
export function createEmbeddingStore(config: StoreConfig): InMemoryEmbeddingStore {
  return new InMemoryEmbeddingStore(config);
}

/**
 * Get or create default store
 */
export function getDefaultStore(dimensions: number = 1536): InMemoryEmbeddingStore {
  if (!defaultStore) {
    defaultStore = createEmbeddingStore({
      dimensions,
      metric: 'cosine',
      indexType: 'none',
    });
  }
  return defaultStore;
}

/**
 * Reset default store (for testing)
 */
export function resetDefaultStore(): void {
  defaultStore = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { InMemoryEmbeddingStore as EmbeddingStore };

export default {
  // Factory
  createEmbeddingStore,
  getDefaultStore,
  resetDefaultStore,

  // SQL
  pgvectorSQL,

  // Utilities
  normalizeVector,
  calculateCentroid,
  randomProjection,
  quantizeVector,
  dequantizeVector,
};
