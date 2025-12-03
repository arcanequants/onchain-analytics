/**
 * Analysis Store
 *
 * In-memory store for analysis records (MVP - replace with DB later)
 */

import { z } from 'zod';

// ================================================================
// TYPES
// ================================================================

const AnalyzeOptionsSchema = z.object({
  providers: z.array(z.enum(['openai', 'anthropic'])).default(['openai', 'anthropic']),
  queryBudget: z.number().int().min(5).max(50).default(20),
  includeCompetitors: z.boolean().default(true),
});

export type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

export interface AnalysisRecord {
  id: string;
  url: string;
  options: AnalyzeOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  resultId?: string;
  error?: string;
}

// ================================================================
// STORE
// ================================================================

// Simple in-memory store - will be replaced with Supabase
const analysisStore = new Map<string, AnalysisRecord>();

export function getAnalysis(id: string): AnalysisRecord | undefined {
  return analysisStore.get(id);
}

export function setAnalysis(id: string, record: AnalysisRecord): void {
  analysisStore.set(id, record);
}

export function updateAnalysis(id: string, updates: Partial<AnalysisRecord>): void {
  const existing = analysisStore.get(id);
  if (existing) {
    analysisStore.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
}

export { AnalyzeOptionsSchema };
