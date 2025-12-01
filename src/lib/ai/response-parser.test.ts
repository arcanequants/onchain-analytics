/**
 * AI Response Parser Tests
 *
 * Phase 1, Week 1, Day 3
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  parseJsonResponse,
  parseWithSchema,
  parseFunctionCallResponse,
  parsePerceptionResponse,
  parseIndustryDetectionResponse,
  safeExtractString,
  safeExtractNumber,
  safeExtractBoolean,
  safeExtractArray,
  PerceptionResponseSchema,
} from './response-parser';

// ================================================================
// JSON EXTRACTION TESTS
// ================================================================

describe('parseJsonResponse', () => {
  describe('direct JSON parsing', () => {
    it('should parse valid JSON object', () => {
      const json = '{"name": "test", "value": 123}';
      const result = parseJsonResponse(json);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ name: 'test', value: 123 });
        expect(result.value.method).toBe('json');
      }
    });

    it('should parse valid JSON array', () => {
      const json = '[1, 2, 3]';
      const result = parseJsonResponse(json);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual([1, 2, 3]);
        expect(result.value.method).toBe('json');
      }
    });
  });

  describe('code block extraction', () => {
    it('should extract JSON from code block', () => {
      const text = `Here is the result:
\`\`\`json
{"status": "success", "score": 85}
\`\`\`
That's the analysis.`;

      const result = parseJsonResponse(text);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ status: 'success', score: 85 });
        expect(result.value.method).toBe('code_block');
      }
    });

    it('should extract from code block without json tag', () => {
      const text = `Result:
\`\`\`
{"data": "value"}
\`\`\``;

      const result = parseJsonResponse(text);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ data: 'value' });
        expect(result.value.method).toBe('code_block');
      }
    });
  });

  describe('text extraction', () => {
    it('should extract JSON object from surrounding text', () => {
      const text = `Based on my analysis, the result is {"brand": "Acme", "score": 75} and that concludes it.`;

      const result = parseJsonResponse(text);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ brand: 'Acme', score: 75 });
        expect(result.value.method).toBe('text');
      }
    });

    it('should handle nested objects', () => {
      const text = `Result: {"outer": {"inner": "value", "num": 42}, "list": [1, 2, 3]}`;

      const result = parseJsonResponse(text);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({
          outer: { inner: 'value', num: 42 },
          list: [1, 2, 3],
        });
      }
    });
  });

  describe('JSON repair', () => {
    it('should fix trailing commas', () => {
      const json = '{"a": 1, "b": 2, }';
      const result = parseJsonResponse(json);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ a: 1, b: 2 });
      }
    });

    it('should handle unquoted keys', () => {
      const json = '{name: "test", value: 123}';
      const result = parseJsonResponse(json);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.data).toEqual({ name: 'test', value: 123 });
      }
    });
  });

  describe('error handling', () => {
    it('should return error for non-JSON text', () => {
      const text = 'This is just plain text without any JSON.';
      const result = parseJsonResponse(text);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('No valid JSON found');
      }
    });

    it('should return error for exceeding max length', () => {
      const text = 'a'.repeat(60000);
      const result = parseJsonResponse(text);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('exceeds maximum length');
      }
    });
  });
});

// ================================================================
// SCHEMA VALIDATION TESTS
// ================================================================

describe('parseWithSchema', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
    active: z.boolean().optional(),
  });

  it('should parse and validate valid JSON', () => {
    const json = '{"name": "John", "age": 30}';
    const result = parseWithSchema(json, testSchema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual({ name: 'John', age: 30 });
      expect(result.value.confidence).toBeGreaterThan(0);
    }
  });

  it('should fail for invalid schema', () => {
    const json = '{"name": "John", "age": "thirty"}';
    const result = parseWithSchema(json, testSchema);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Schema validation failed');
    }
  });

  it('should fail for missing required fields', () => {
    const json = '{"name": "John"}';
    const result = parseWithSchema(json, testSchema);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('age');
    }
  });

  it('should include extraction method in result', () => {
    const text = `Result: {"name": "John", "age": 30}`;
    const result = parseWithSchema(text, testSchema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.extractionMethod).toBe('text');
    }
  });
});

// ================================================================
// FUNCTION CALL PARSING TESTS
// ================================================================

describe('parseFunctionCallResponse', () => {
  const schema = z.object({
    result: z.string(),
    score: z.number(),
  });

  it('should parse OpenAI function call format', () => {
    const response = {
      choices: [{
        message: {
          function_call: {
            name: 'analyze',
            arguments: '{"result": "success", "score": 85}',
          },
        },
      }],
    };

    const result = parseFunctionCallResponse(response, schema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual({ result: 'success', score: 85 });
      expect(result.value.extractionMethod).toBe('function_call');
    }
  });

  it('should parse OpenAI tool_calls format', () => {
    const response = {
      choices: [{
        message: {
          tool_calls: [{
            function: {
              name: 'analyze',
              arguments: '{"result": "done", "score": 90}',
            },
          }],
        },
      }],
    };

    const result = parseFunctionCallResponse(response, schema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual({ result: 'done', score: 90 });
    }
  });

  it('should return error for non-function response', () => {
    const response = {
      choices: [{
        message: {
          content: 'Just a regular message',
        },
      }],
    };

    const result = parseFunctionCallResponse(response, schema);

    expect(result.ok).toBe(false);
  });
});

// ================================================================
// PERCEPTION RESPONSE TESTS
// ================================================================

describe('parsePerceptionResponse', () => {
  it('should parse valid perception response', () => {
    const response = `\`\`\`json
{
  "brand_mentioned": true,
  "brand_recommended": true,
  "position": 1,
  "sentiment": "positive",
  "confidence": 0.85,
  "competitors_mentioned": ["Competitor A", "Competitor B"],
  "context": "The brand was recommended as the top choice",
  "reasoning": "Strong market presence"
}
\`\`\``;

    const result = parsePerceptionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data.brand_mentioned).toBe(true);
      expect(result.value.data.brand_recommended).toBe(true);
      expect(result.value.data.position).toBe(1);
      expect(result.value.data.sentiment).toBe('positive');
      expect(result.value.data.competitors_mentioned).toHaveLength(2);
    }
  });

  it('should handle null position', () => {
    const response = `{
      "brand_mentioned": false,
      "brand_recommended": false,
      "position": null,
      "sentiment": "neutral",
      "confidence": 0.5,
      "competitors_mentioned": []
    }`;

    const result = parsePerceptionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data.position).toBeNull();
    }
  });

  it('should reject invalid sentiment', () => {
    const response = `{
      "brand_mentioned": true,
      "brand_recommended": true,
      "position": 1,
      "sentiment": "excellent",
      "confidence": 0.9,
      "competitors_mentioned": []
    }`;

    const result = parsePerceptionResponse(response);

    expect(result.ok).toBe(false);
  });

  it('should reject confidence out of range', () => {
    const response = `{
      "brand_mentioned": true,
      "brand_recommended": true,
      "position": 1,
      "sentiment": "positive",
      "confidence": 1.5,
      "competitors_mentioned": []
    }`;

    const result = parsePerceptionResponse(response);

    expect(result.ok).toBe(false);
  });
});

// ================================================================
// INDUSTRY DETECTION RESPONSE TESTS
// ================================================================

describe('parseIndustryDetectionResponse', () => {
  it('should parse valid industry response', () => {
    const response = `{
      "industry": "saas",
      "subIndustry": "crm",
      "country": "US",
      "entityType": "business",
      "competitors": ["Salesforce", "HubSpot"],
      "confidence": 0.9,
      "reasoning": "Strong SaaS indicators in content"
    }`;

    const result = parseIndustryDetectionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data.industry).toBe('saas');
      expect(result.value.data.entityType).toBe('business');
    }
  });

  it('should handle null subIndustry', () => {
    const response = `{
      "industry": "professional-services",
      "subIndustry": null,
      "country": null,
      "entityType": "service",
      "competitors": [],
      "confidence": 0.6
    }`;

    const result = parseIndustryDetectionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data.subIndustry).toBeNull();
    }
  });
});

// ================================================================
// SAFE EXTRACTION UTILITIES TESTS
// ================================================================

describe('safeExtractString', () => {
  it('should extract strings', () => {
    expect(safeExtractString('hello')).toBe('hello');
  });

  it('should return null for null/undefined', () => {
    expect(safeExtractString(null)).toBeNull();
    expect(safeExtractString(undefined)).toBeNull();
  });

  it('should convert numbers to strings', () => {
    expect(safeExtractString(123)).toBe('123');
  });

  it('should stringify objects', () => {
    expect(safeExtractString({ a: 1 })).toBe('{"a":1}');
  });
});

describe('safeExtractNumber', () => {
  it('should extract numbers', () => {
    expect(safeExtractNumber(42)).toBe(42);
    expect(safeExtractNumber(3.14)).toBe(3.14);
  });

  it('should parse numeric strings', () => {
    expect(safeExtractNumber('42')).toBe(42);
    expect(safeExtractNumber('3.14')).toBe(3.14);
  });

  it('should return null for NaN', () => {
    expect(safeExtractNumber(NaN)).toBeNull();
    expect(safeExtractNumber('not a number')).toBeNull();
  });

  it('should return null for non-numeric', () => {
    expect(safeExtractNumber(null)).toBeNull();
    expect(safeExtractNumber({})).toBeNull();
  });
});

describe('safeExtractBoolean', () => {
  it('should extract booleans', () => {
    expect(safeExtractBoolean(true)).toBe(true);
    expect(safeExtractBoolean(false)).toBe(false);
  });

  it('should parse boolean strings', () => {
    expect(safeExtractBoolean('true')).toBe(true);
    expect(safeExtractBoolean('false')).toBe(false);
    expect(safeExtractBoolean('1')).toBe(true);
    expect(safeExtractBoolean('0')).toBe(false);
  });

  it('should return null for non-boolean', () => {
    expect(safeExtractBoolean(null)).toBeNull();
    expect(safeExtractBoolean('yes')).toBeNull();
    expect(safeExtractBoolean(1)).toBeNull();
  });
});

describe('safeExtractArray', () => {
  it('should extract arrays', () => {
    expect(safeExtractArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('should return null for non-arrays', () => {
    expect(safeExtractArray(null)).toBeNull();
    expect(safeExtractArray('not array')).toBeNull();
    expect(safeExtractArray({ length: 2 })).toBeNull();
  });

  it('should filter with validator', () => {
    const isString = (x: unknown): x is string => typeof x === 'string';
    expect(safeExtractArray(['a', 1, 'b', 2], isString)).toEqual(['a', 'b']);
  });
});

// ================================================================
// EDGE CASES AND ROBUSTNESS TESTS
// ================================================================

describe('edge cases', () => {
  it('should handle empty JSON object', () => {
    const result = parseJsonResponse('{}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual({});
    }
  });

  it('should handle empty JSON array', () => {
    const result = parseJsonResponse('[]');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual([]);
    }
  });

  it('should handle deeply nested JSON', () => {
    const nested = { a: { b: { c: { d: { e: 'deep' } } } } };
    const result = parseJsonResponse(JSON.stringify(nested));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual(nested);
    }
  });

  it('should handle JSON with special characters', () => {
    const json = '{"message": "Hello \\"world\\"", "emoji": "🎉"}';
    const result = parseJsonResponse(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value.data as Record<string, string>).message).toBe('Hello "world"');
      expect((result.value.data as Record<string, string>).emoji).toBe('🎉');
    }
  });

  it('should handle multiple JSON objects in text', () => {
    const text = 'First: {"a": 1} Second: {"b": 2}';
    const result = parseJsonResponse(text);
    // Should extract the first one
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.data).toEqual({ a: 1 });
    }
  });

  it('should handle JSON with unicode', () => {
    const json = '{"name": "Café", "city": "東京"}';
    const result = parseJsonResponse(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value.data as Record<string, string>).name).toBe('Café');
      expect((result.value.data as Record<string, string>).city).toBe('東京');
    }
  });
});
