/**
 * AI Response Parser
 *
 * Phase 1, Week 1, Day 3
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4
 *
 * Features:
 * - Parse structured JSON responses from AI providers
 * - Validate against Zod schemas
 * - Extract data from markdown code blocks
 * - Handle partial/malformed responses gracefully
 * - Support function calling format
 */

import { z } from 'zod';
import type { Result } from '@/lib/result';
import { Ok, Err } from '@/lib/result';

// ================================================================
// TYPES
// ================================================================

export interface ParseResult<T> {
  data: T;
  raw: string;
  extractionMethod: 'json' | 'code_block' | 'function_call' | 'text';
  confidence: number;
}

export interface ParserOptions {
  /** Attempt to repair malformed JSON */
  attemptRepair?: boolean;
  /** Extract from markdown code blocks */
  extractFromCodeBlocks?: boolean;
  /** Support function calling format */
  supportFunctionCalling?: boolean;
  /** Maximum response length to process */
  maxLength?: number;
}

const DEFAULT_OPTIONS: Required<ParserOptions> = {
  attemptRepair: true,
  extractFromCodeBlocks: true,
  supportFunctionCalling: true,
  maxLength: 50000,
};

// ================================================================
// JSON EXTRACTION UTILITIES
// ================================================================

/**
 * Extract JSON from a markdown code block
 */
function extractFromCodeBlock(text: string): string | null {
  // Match ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)\n?```/gi;
  const matches = [...text.matchAll(codeBlockRegex)];

  for (const match of matches) {
    const content = match[1].trim();
    // Check if it looks like JSON
    if (content.startsWith('{') || content.startsWith('[')) {
      return content;
    }
  }

  return null;
}

/**
 * Extract JSON object from text (finds first { } pair)
 */
function extractJsonObject(text: string): string | null {
  const startIndex = text.indexOf('{');
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(startIndex, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * Extract JSON array from text (finds first [ ] pair)
 */
function extractJsonArray(text: string): string | null {
  const startIndex = text.indexOf('[');
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '[') depth++;
      if (char === ']') {
        depth--;
        if (depth === 0) {
          return text.slice(startIndex, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * Attempt to repair common JSON issues
 */
function attemptJsonRepair(text: string): string {
  let repaired = text;

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Add missing quotes around unquoted keys
  repaired = repaired.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

  // Replace single quotes with double quotes (common mistake)
  // But be careful not to replace apostrophes in text
  repaired = repaired.replace(/:\s*'([^']*)'/g, ': "$1"');

  // Fix undefined to null
  repaired = repaired.replace(/:\s*undefined/g, ': null');

  // Fix NaN to null
  repaired = repaired.replace(/:\s*NaN/g, ': null');

  // Fix Infinity to null
  repaired = repaired.replace(/:\s*Infinity/g, ': null');
  repaired = repaired.replace(/:\s*-Infinity/g, ': null');

  return repaired;
}

// ================================================================
// FUNCTION CALLING SUPPORT
// ================================================================

/**
 * OpenAI function call response format
 */
interface FunctionCallResponse {
  name: string;
  arguments: string;
}

/**
 * Extract data from OpenAI function call format
 */
function extractFromFunctionCall(response: unknown): unknown | null {
  if (!response || typeof response !== 'object') return null;

  const resp = response as Record<string, unknown>;

  // Check for function_call in message
  if (resp.choices && Array.isArray(resp.choices)) {
    const choice = resp.choices[0] as Record<string, unknown> | undefined;
    if (choice?.message) {
      const message = choice.message as Record<string, unknown>;
      if (message.function_call) {
        const funcCall = message.function_call as FunctionCallResponse;
        try {
          return JSON.parse(funcCall.arguments);
        } catch {
          return null;
        }
      }
      // Also check tool_calls (newer format)
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        const toolCall = message.tool_calls[0] as Record<string, unknown> | undefined;
        if (toolCall?.function) {
          const func = toolCall.function as FunctionCallResponse;
          try {
            return JSON.parse(func.arguments);
          } catch {
            return null;
          }
        }
      }
    }
  }

  return null;
}

// ================================================================
// MAIN PARSER FUNCTIONS
// ================================================================

/**
 * Parse raw text response and extract JSON
 */
export function parseJsonResponse(
  text: string,
  options: ParserOptions = {}
): Result<{ data: unknown; method: 'json' | 'code_block' | 'text' }, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check length
  if (text.length > opts.maxLength) {
    return Err(`Response exceeds maximum length of ${opts.maxLength} characters`);
  }

  // 1. Try extracting from code blocks first
  if (opts.extractFromCodeBlocks) {
    const codeBlockJson = extractFromCodeBlock(text);
    if (codeBlockJson) {
      try {
        const data = JSON.parse(codeBlockJson);
        return Ok({ data, method: 'code_block' });
      } catch {
        // Try repair
        if (opts.attemptRepair) {
          try {
            const repaired = attemptJsonRepair(codeBlockJson);
            const data = JSON.parse(repaired);
            return Ok({ data, method: 'code_block' });
          } catch {
            // Continue to other methods
          }
        }
      }
    }
  }

  // 2. Try parsing the whole text as JSON
  try {
    const data = JSON.parse(text);
    return Ok({ data, method: 'json' });
  } catch {
    // Continue
  }

  // 3. Try extracting JSON object from text
  const jsonObject = extractJsonObject(text);
  if (jsonObject) {
    try {
      const data = JSON.parse(jsonObject);
      return Ok({ data, method: 'text' });
    } catch {
      if (opts.attemptRepair) {
        try {
          const repaired = attemptJsonRepair(jsonObject);
          const data = JSON.parse(repaired);
          return Ok({ data, method: 'text' });
        } catch {
          // Continue
        }
      }
    }
  }

  // 4. Try extracting JSON array from text
  const jsonArray = extractJsonArray(text);
  if (jsonArray) {
    try {
      const data = JSON.parse(jsonArray);
      return Ok({ data, method: 'text' });
    } catch {
      if (opts.attemptRepair) {
        try {
          const repaired = attemptJsonRepair(jsonArray);
          const data = JSON.parse(repaired);
          return Ok({ data, method: 'text' });
        } catch {
          // Continue
        }
      }
    }
  }

  return Err('No valid JSON found in response');
}

/**
 * Parse and validate response against a Zod schema
 */
export function parseWithSchema<T>(
  text: string,
  schema: z.ZodType<T>,
  options: ParserOptions = {}
): Result<ParseResult<T>, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // First extract JSON
  const jsonResult = parseJsonResponse(text, opts);

  if (!jsonResult.ok) {
    return Err(jsonResult.error);
  }

  // Validate against schema
  const parseResult = schema.safeParse(jsonResult.value.data);

  if (!parseResult.success) {
    const zodError = parseResult.error;
    const errors = zodError.issues
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    return Err(`Schema validation failed: ${errors}`);
  }

  return Ok({
    data: parseResult.data,
    raw: text,
    extractionMethod: jsonResult.value.method,
    confidence: calculateConfidence(jsonResult.value.method, text),
  });
}

/**
 * Parse function call response and validate against schema
 */
export function parseFunctionCallResponse<T>(
  response: unknown,
  schema: z.ZodType<T>
): Result<ParseResult<T>, string> {
  const extracted = extractFromFunctionCall(response);

  if (extracted === null) {
    return Err('No function call data found in response');
  }

  const parseResult = schema.safeParse(extracted);

  if (!parseResult.success) {
    const errors = parseResult.error.issues
      .map(e => `${String(e.path.join('.'))}: ${e.message}`)
      .join('; ');
    return Err(`Schema validation failed: ${errors}`);
  }

  return Ok({
    data: parseResult.data,
    raw: JSON.stringify(response),
    extractionMethod: 'function_call',
    confidence: 0.95, // Function calls are highly structured
  });
}

/**
 * Calculate confidence score based on extraction method
 */
function calculateConfidence(
  method: 'json' | 'code_block' | 'function_call' | 'text',
  rawText: string
): number {
  let baseConfidence: number;

  switch (method) {
    case 'function_call':
      baseConfidence = 0.95;
      break;
    case 'json':
      baseConfidence = 0.9;
      break;
    case 'code_block':
      baseConfidence = 0.85;
      break;
    case 'text':
      baseConfidence = 0.7;
      break;
    default:
      baseConfidence = 0.5;
  }

  // Reduce confidence if response seems truncated
  if (rawText.length > 1000 && !rawText.trim().endsWith('}') && !rawText.trim().endsWith(']')) {
    baseConfidence -= 0.1;
  }

  // Reduce confidence if there's a lot of non-JSON content
  const jsonContentRatio = estimateJsonRatio(rawText);
  if (jsonContentRatio < 0.5) {
    baseConfidence -= 0.1;
  }

  return Math.max(0.1, Math.min(1, baseConfidence));
}

/**
 * Estimate what portion of the text is JSON content
 */
function estimateJsonRatio(text: string): number {
  const jsonPattern = /[{}\[\]":\d,\s]/g;
  const jsonChars = (text.match(jsonPattern) || []).length;
  return jsonChars / text.length;
}

// ================================================================
// SPECIFIC RESPONSE PARSERS
// ================================================================

/**
 * Schema for AI perception response
 */
export const PerceptionResponseSchema = z.object({
  brand_mentioned: z.boolean(),
  brand_recommended: z.boolean(),
  position: z.number().nullable(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),
  confidence: z.number().min(0).max(1),
  competitors_mentioned: z.array(z.string()).default([]),
  context: z.string().optional(),
  direct_quote: z.string().optional(),
  reasoning: z.string().optional(),
});

export type PerceptionResponse = z.infer<typeof PerceptionResponseSchema>;

/**
 * Parse perception query response
 */
export function parsePerceptionResponse(
  text: string,
  options?: ParserOptions
): Result<ParseResult<PerceptionResponse>, string> {
  return parseWithSchema(text, PerceptionResponseSchema, options);
}

/**
 * Schema for industry detection response
 */
export const IndustryDetectionResponseSchema = z.object({
  industry: z.string(),
  subIndustry: z.string().nullable(),
  country: z.string().nullable(),
  entityType: z.enum(['business', 'product', 'service', 'personal']),
  competitors: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export type IndustryDetectionResponse = z.infer<typeof IndustryDetectionResponseSchema>;

/**
 * Parse industry detection response
 */
export function parseIndustryDetectionResponse(
  text: string,
  options?: ParserOptions
): Result<ParseResult<IndustryDetectionResponse>, string> {
  return parseWithSchema(text, IndustryDetectionResponseSchema, options);
}

/**
 * Schema for recommendation response
 */
export const RecommendationResponseSchema = z.object({
  recommendations: z.array(z.object({
    category: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    title: z.string(),
    description: z.string(),
    impact: z.string().optional(),
    effort: z.enum(['low', 'medium', 'high']).optional(),
  })),
  summary: z.string().optional(),
});

export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;

/**
 * Parse recommendation response
 */
export function parseRecommendationResponse(
  text: string,
  options?: ParserOptions
): Result<ParseResult<RecommendationResponse>, string> {
  return parseWithSchema(text, RecommendationResponseSchema, options);
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Safely extract a string value from potentially any type
 */
export function safeExtractString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return String(value);
}

/**
 * Safely extract a number value
 */
export function safeExtractNumber(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
  }
  return null;
}

/**
 * Safely extract a boolean value
 */
export function safeExtractBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return null;
}

/**
 * Safely extract an array
 */
export function safeExtractArray<T>(
  value: unknown,
  validator?: (item: unknown) => item is T
): T[] | null {
  if (!Array.isArray(value)) return null;
  if (!validator) return value as T[];
  return value.filter(validator);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  parseJsonResponse,
  parseWithSchema,
  parseFunctionCallResponse,
  parsePerceptionResponse,
  parseIndustryDetectionResponse,
  parseRecommendationResponse,
  safeExtractString,
  safeExtractNumber,
  safeExtractBoolean,
  safeExtractArray,
  PerceptionResponseSchema,
  IndustryDetectionResponseSchema,
  RecommendationResponseSchema,
};
