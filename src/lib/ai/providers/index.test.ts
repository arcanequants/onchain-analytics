/**
 * AI Provider Clients Tests
 * Phase 2, Week 7, Day 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  PerplexityProvider,
  MockAIProvider,
  createProvider,
  createProviders,
  type AIProviderConfig,
} from './index';

// ================================================================
// MOCK FETCH
// ================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock responses
function createMockResponse(status: number, body: object, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  };
}

// ================================================================
// OPENAI PROVIDER TESTS
// ================================================================

describe('OpenAIProvider', () => {
  const config: AIProviderConfig = {
    apiKey: 'test-api-key',
    model: 'gpt-4o-mini',
    defaultTimeout: 5000,
    maxRetries: 1,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default model if not specified', () => {
      const provider = new OpenAIProvider({ apiKey: 'test' });
      expect(provider.model).toBe('gpt-4o-mini');
    });

    it('should use specified model', () => {
      const provider = new OpenAIProvider({ apiKey: 'test', model: 'gpt-4' });
      expect(provider.model).toBe('gpt-4');
    });

    it('should have correct provider name', () => {
      const provider = new OpenAIProvider(config);
      expect(provider.name).toBe('openai');
    });
  });

  describe('query', () => {
    it('should return successful response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'Hello!' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          model: 'gpt-4o-mini',
        })
      );

      const provider = new OpenAIProvider(config);
      const result = await provider.query('Hello');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('Hello!');
        expect(result.value.tokensUsed.total).toBe(15);
        expect(result.value.provider).toBe('openai');
        expect(result.value.finishReason).toBe('stop');
      }
    });

    it('should include correct headers', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
      );

      const provider = new OpenAIProvider(config);
      await provider.query('Test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should use temperature from options', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
      );

      const provider = new OpenAIProvider(config);
      await provider.query('Test', { temperature: 0.5 });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.temperature).toBe(0.5);
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(429, { error: { message: 'Rate limited' } }, { 'retry-after': '30' })
      );

      const provider = new OpenAIProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.provider).toBe('openai');
        expect(result.error.message).toContain('rate limit');
      }
    });

    it('should handle 500 server error with retry', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(500, { error: { message: 'Server error' } }))
        .mockResolvedValueOnce(
          createMockResponse(200, {
            choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          })
        );

      const provider = new OpenAIProvider({ ...config, maxRetries: 1 });
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty content', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: {}, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
        })
      );

      const provider = new OpenAIProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('');
      }
    });

    it('should handle length finish reason', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'Truncated...' }, finish_reason: 'length' }],
          usage: { prompt_tokens: 10, completion_tokens: 100, total_tokens: 110 },
        })
      );

      const provider = new OpenAIProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.finishReason).toBe('length');
      }
    });
  });

  describe('parseStructured', () => {
    it('should parse valid JSON', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const provider = new OpenAIProvider(config);

      const result = provider.parseStructured('{"name": "Test", "age": 25}', schema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Test');
        expect(result.value.age).toBe(25);
      }
    });

    it('should extract JSON from text', () => {
      const schema = z.object({ status: z.string() });
      const provider = new OpenAIProvider(config);

      const result = provider.parseStructured(
        'Here is the response: {"status": "ok"} and some more text.',
        schema
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe('ok');
      }
    });

    it('should fail on invalid JSON', () => {
      const schema = z.object({ status: z.string() });
      const provider = new OpenAIProvider(config);

      const result = provider.parseStructured('not json at all', schema);

      expect(result.ok).toBe(false);
    });

    it('should fail on schema mismatch', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const provider = new OpenAIProvider(config);

      const result = provider.parseStructured('{"name": "Test"}', schema);

      expect(result.ok).toBe(false);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for gpt-4o-mini', () => {
      const provider = new OpenAIProvider({ apiKey: 'test', model: 'gpt-4o-mini' });
      const cost = provider.calculateCost(1000, 500);

      // $0.15/1M input, $0.6/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 0.15 + (500 / 1_000_000) * 0.6, 8);
    });

    it('should calculate cost for gpt-3.5-turbo', () => {
      const provider = new OpenAIProvider({ apiKey: 'test', model: 'gpt-3.5-turbo' });
      const cost = provider.calculateCost(1000, 500);

      // $0.5/1M input, $1.5/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 0.5 + (500 / 1_000_000) * 1.5, 8);
    });
  });

  describe('isHealthy', () => {
    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { object: 'list', data: [] }));

      const provider = new OpenAIProvider(config);
      const healthy = await provider.isHealthy();

      expect(healthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should return false for failed health check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(401, { error: 'Unauthorized' }));

      const provider = new OpenAIProvider(config);
      const healthy = await provider.isHealthy();

      expect(healthy).toBe(false);
    });
  });
});

// ================================================================
// ANTHROPIC PROVIDER TESTS
// ================================================================

describe('AnthropicProvider', () => {
  const config: AIProviderConfig = {
    apiKey: 'test-api-key',
    model: 'claude-3-5-haiku-20241022',
    defaultTimeout: 5000,
    maxRetries: 1,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default model if not specified', () => {
      const provider = new AnthropicProvider({ apiKey: 'test' });
      expect(provider.model).toBe('claude-3-5-haiku-20241022');
    });

    it('should have correct provider name', () => {
      const provider = new AnthropicProvider(config);
      expect(provider.name).toBe('anthropic');
    });
  });

  describe('query', () => {
    it('should return successful response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          content: [{ type: 'text', text: 'Hello from Claude!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          model: 'claude-3-5-haiku-20241022',
          stop_reason: 'end_turn',
        })
      );

      const provider = new AnthropicProvider(config);
      const result = await provider.query('Hello');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('Hello from Claude!');
        expect(result.value.tokensUsed.total).toBe(15);
        expect(result.value.provider).toBe('anthropic');
        expect(result.value.finishReason).toBe('stop');
      }
    });

    it('should include correct headers', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          content: [{ type: 'text', text: 'OK' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        })
      );

      const provider = new AnthropicProvider(config);
      await provider.query('Test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should handle multiple content blocks', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          content: [
            { type: 'text', text: 'Part 1. ' },
            { type: 'text', text: 'Part 2.' },
          ],
          usage: { input_tokens: 10, output_tokens: 10 },
          stop_reason: 'end_turn',
        })
      );

      const provider = new AnthropicProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('Part 1. Part 2.');
      }
    });

    it('should handle max_tokens stop reason', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          content: [{ type: 'text', text: 'Truncated...' }],
          usage: { input_tokens: 10, output_tokens: 100 },
          stop_reason: 'max_tokens',
        })
      );

      const provider = new AnthropicProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.finishReason).toBe('length');
      }
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(429, { error: { message: 'Rate limited' } }, { 'retry-after': '60' })
      );

      const provider = new AnthropicProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.provider).toBe('anthropic');
      }
    });
  });

  describe('parseStructured', () => {
    it('should parse valid JSON', () => {
      const schema = z.object({ result: z.string() });
      const provider = new AnthropicProvider(config);

      const result = provider.parseStructured('{"result": "success"}', schema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.result).toBe('success');
      }
    });

    it('should extract JSON from XML output tags', () => {
      const schema = z.object({ result: z.string() });
      const provider = new AnthropicProvider(config);

      const result = provider.parseStructured(
        'Let me think about this.\n<output>{"result": "success"}</output>',
        schema
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.result).toBe('success');
      }
    });

    it('should handle complex nested XML', () => {
      const schema = z.object({ items: z.array(z.string()) });
      const provider = new AnthropicProvider(config);

      const result = provider.parseStructured(
        'Here is my analysis:\n<output>\n{"items": ["a", "b", "c"]}\n</output>\nLet me know if you need more.',
        schema
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual(['a', 'b', 'c']);
      }
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for claude-3-5-haiku', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test',
        model: 'claude-3-5-haiku-20241022',
      });
      const cost = provider.calculateCost(1000, 500);

      // $0.8/1M input, $4/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 0.8 + (500 / 1_000_000) * 4, 8);
    });

    it('should calculate cost for claude-3-haiku', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test',
        model: 'claude-3-haiku-20240307',
      });
      const cost = provider.calculateCost(1000, 500);

      // $0.25/1M input, $1.25/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 0.25 + (500 / 1_000_000) * 1.25, 8);
    });
  });
});

// ================================================================
// GOOGLE PROVIDER TESTS
// ================================================================

describe('GoogleProvider', () => {
  const config: AIProviderConfig = {
    apiKey: 'test-api-key',
    model: 'gemini-1.5-flash',
    defaultTimeout: 5000,
    maxRetries: 1,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default model if not specified', () => {
      const provider = new GoogleProvider({ apiKey: 'test' });
      expect(provider.model).toBe('gemini-1.5-flash');
    });

    it('should use specified model', () => {
      const provider = new GoogleProvider({ apiKey: 'test', model: 'gemini-1.5-pro' });
      expect(provider.model).toBe('gemini-1.5-pro');
    });

    it('should have correct provider name', () => {
      const provider = new GoogleProvider(config);
      expect(provider.name).toBe('google');
    });
  });

  describe('query', () => {
    it('should return successful response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'Hello from Gemini!' }] }, finishReason: 'STOP' }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        })
      );

      const provider = new GoogleProvider(config);
      const result = await provider.query('Hello');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('Hello from Gemini!');
        expect(result.value.tokensUsed.total).toBe(15);
        expect(result.value.provider).toBe('google');
        expect(result.value.finishReason).toBe('stop');
      }
    });

    it('should include API key in URL', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'OK' }] }, finishReason: 'STOP' }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        })
      );

      const provider = new GoogleProvider(config);
      await provider.query('Test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use temperature from options', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'OK' }] }, finishReason: 'STOP' }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        })
      );

      const provider = new GoogleProvider(config);
      await provider.query('Test', { temperature: 0.7 });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.generationConfig.temperature).toBe(0.7);
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(429, { error: { message: 'Rate limited' } }, { 'retry-after': '30' })
      );

      const provider = new GoogleProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.provider).toBe('google');
        expect(result.error.message).toContain('rate limit');
      }
    });

    it('should handle SAFETY finish reason', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'Content blocked' }] }, finishReason: 'SAFETY' }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        })
      );

      const provider = new GoogleProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.finishReason).toBe('content_filter');
      }
    });

    it('should handle MAX_TOKENS finish reason', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          candidates: [{ content: { parts: [{ text: 'Truncated...' }] }, finishReason: 'MAX_TOKENS' }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 100, totalTokenCount: 110 },
        })
      );

      const provider = new GoogleProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.finishReason).toBe('length');
      }
    });
  });

  describe('parseStructured', () => {
    it('should parse valid JSON', () => {
      const schema = z.object({ name: z.string(), value: z.number() });
      const provider = new GoogleProvider(config);

      const result = provider.parseStructured('{"name": "Test", "value": 42}', schema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Test');
        expect(result.value.value).toBe(42);
      }
    });

    it('should extract JSON from text', () => {
      const schema = z.object({ status: z.string() });
      const provider = new GoogleProvider(config);

      const result = provider.parseStructured(
        'Here is the response: {"status": "ok"} and some more text.',
        schema
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe('ok');
      }
    });

    it('should fail on invalid JSON', () => {
      const schema = z.object({ status: z.string() });
      const provider = new GoogleProvider(config);

      const result = provider.parseStructured('not json at all', schema);

      expect(result.ok).toBe(false);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for gemini-1.5-flash', () => {
      const provider = new GoogleProvider({ apiKey: 'test', model: 'gemini-1.5-flash' });
      const cost = provider.calculateCost(1000, 500);

      // $0.075/1M input, $0.30/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 0.075 + (500 / 1_000_000) * 0.30, 8);
    });

    it('should calculate cost for gemini-1.5-pro', () => {
      const provider = new GoogleProvider({ apiKey: 'test', model: 'gemini-1.5-pro' });
      const cost = provider.calculateCost(1000, 500);

      // $1.25/1M input, $5.0/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 1.25 + (500 / 1_000_000) * 5.0, 8);
    });
  });

  describe('isHealthy', () => {
    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(200, { name: 'models/gemini-1.5-flash' }));

      const provider = new GoogleProvider(config);
      const healthy = await provider.isHealthy();

      expect(healthy).toBe(true);
    });

    it('should return false for failed health check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(401, { error: 'Unauthorized' }));

      const provider = new GoogleProvider(config);
      const healthy = await provider.isHealthy();

      expect(healthy).toBe(false);
    });
  });
});

// ================================================================
// PERPLEXITY PROVIDER TESTS
// ================================================================

describe('PerplexityProvider', () => {
  const config: AIProviderConfig = {
    apiKey: 'test-api-key',
    model: 'llama-3.1-sonar-small-128k-online',
    defaultTimeout: 5000,
    maxRetries: 1,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default model if not specified', () => {
      const provider = new PerplexityProvider({ apiKey: 'test' });
      expect(provider.model).toBe('llama-3.1-sonar-small-128k-online');
    });

    it('should use specified model', () => {
      const provider = new PerplexityProvider({ apiKey: 'test', model: 'llama-3.1-sonar-large-128k-online' });
      expect(provider.model).toBe('llama-3.1-sonar-large-128k-online');
    });

    it('should have correct provider name', () => {
      const provider = new PerplexityProvider(config);
      expect(provider.name).toBe('perplexity');
    });
  });

  describe('query', () => {
    it('should return successful response', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'Hello from Perplexity!' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          model: 'llama-3.1-sonar-small-128k-online',
        })
      );

      const provider = new PerplexityProvider(config);
      const result = await provider.query('Hello');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.content).toBe('Hello from Perplexity!');
        expect(result.value.tokensUsed.total).toBe(15);
        expect(result.value.provider).toBe('perplexity');
        expect(result.value.finishReason).toBe('stop');
      }
    });

    it('should include correct headers', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
      );

      const provider = new PerplexityProvider(config);
      await provider.query('Test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should use OpenAI-compatible request format', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
      );

      const provider = new PerplexityProvider(config);
      await provider.query('Test', { temperature: 0.5, maxTokens: 500 });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.model).toBe('llama-3.1-sonar-small-128k-online');
      expect(body.messages).toEqual([{ role: 'user', content: 'Test' }]);
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(500);
    });

    it('should handle 429 rate limit error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(429, { error: { message: 'Rate limited' } }, { 'retry-after': '30' })
      );

      const provider = new PerplexityProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.provider).toBe('perplexity');
        expect(result.error.message).toContain('rate limit');
      }
    });

    it('should handle length finish reason', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'Truncated...' }, finish_reason: 'length' }],
          usage: { prompt_tokens: 10, completion_tokens: 100, total_tokens: 110 },
        })
      );

      const provider = new PerplexityProvider(config);
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.finishReason).toBe('length');
      }
    });

    it('should handle 500 server error with retry', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(500, { error: { message: 'Server error' } }))
        .mockResolvedValueOnce(
          createMockResponse(200, {
            choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          })
        );

      const provider = new PerplexityProvider({ ...config, maxRetries: 1 });
      const result = await provider.query('Test');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('parseStructured', () => {
    it('should parse valid JSON', () => {
      const schema = z.object({ answer: z.string(), sources: z.array(z.string()) });
      const provider = new PerplexityProvider(config);

      const result = provider.parseStructured(
        '{"answer": "Based on my research...", "sources": ["source1", "source2"]}',
        schema
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.answer).toBe('Based on my research...');
        expect(result.value.sources).toHaveLength(2);
      }
    });

    it('should extract JSON from text', () => {
      const schema = z.object({ result: z.boolean() });
      const provider = new PerplexityProvider(config);

      const result = provider.parseStructured(
        'After searching the web, here is what I found: {"result": true}. Hope this helps!',
        schema
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.result).toBe(true);
      }
    });

    it('should fail on schema mismatch', () => {
      const schema = z.object({ required: z.number() });
      const provider = new PerplexityProvider(config);

      const result = provider.parseStructured('{"optional": "value"}', schema);

      expect(result.ok).toBe(false);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for sonar-small', () => {
      const provider = new PerplexityProvider({
        apiKey: 'test',
        model: 'llama-3.1-sonar-small-128k-online',
      });
      const cost = provider.calculateCost(1000, 500);

      // $0.2/1M input, $0.2/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 0.2 + (500 / 1_000_000) * 0.2, 8);
    });

    it('should calculate cost for sonar-large', () => {
      const provider = new PerplexityProvider({
        apiKey: 'test',
        model: 'llama-3.1-sonar-large-128k-online',
      });
      const cost = provider.calculateCost(1000, 500);

      // $1.0/1M input, $1.0/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 1.0 + (500 / 1_000_000) * 1.0, 8);
    });

    it('should calculate cost for sonar-huge', () => {
      const provider = new PerplexityProvider({
        apiKey: 'test',
        model: 'llama-3.1-sonar-huge-128k-online',
      });
      const cost = provider.calculateCost(1000, 500);

      // $5.0/1M input, $5.0/1M output
      expect(cost).toBeCloseTo((1000 / 1_000_000) * 5.0 + (500 / 1_000_000) * 5.0, 8);
    });
  });

  describe('isHealthy', () => {
    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'pong' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        })
      );

      const provider = new PerplexityProvider(config);
      const healthy = await provider.isHealthy();

      expect(healthy).toBe(true);
    });

    it('should return false for failed health check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(401, { error: 'Unauthorized' }));

      const provider = new PerplexityProvider(config);
      const healthy = await provider.isHealthy();

      expect(healthy).toBe(false);
    });
  });
});

// ================================================================
// MOCK PROVIDER TESTS
// ================================================================

describe('MockAIProvider', () => {
  it('should return configured responses', async () => {
    const mock = new MockAIProvider('openai');
    mock.setResponse('hello', '{"greeting": "Hello there!"}');

    const result = await mock.query('Say hello to me');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toContain('Hello there!');
    }
  });

  it('should return failure when configured', async () => {
    const mock = new MockAIProvider('anthropic');
    mock.setFailure(true);

    const result = await mock.query('Test');

    expect(result.ok).toBe(false);
  });

  it('should respect latency setting', async () => {
    const mock = new MockAIProvider();
    mock.setLatency(50);

    const start = Date.now();
    await mock.query('Test');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some variance
  });

  it('should parse structured responses', () => {
    const mock = new MockAIProvider();
    const schema = z.object({ success: z.boolean() });

    const result = mock.parseStructured('{"success": true}', schema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.success).toBe(true);
    }
  });

  it('should report healthy when not failing', async () => {
    const mock = new MockAIProvider();
    expect(await mock.isHealthy()).toBe(true);
  });

  it('should report unhealthy when failing', async () => {
    const mock = new MockAIProvider();
    mock.setFailure(true);
    expect(await mock.isHealthy()).toBe(false);
  });

  it('should calculate mock cost', () => {
    const mock = new MockAIProvider();
    expect(mock.calculateCost(1000, 500)).toBe(0.001);
  });
});

// ================================================================
// FACTORY TESTS
// ================================================================

describe('createProvider', () => {
  it('should create OpenAI provider', () => {
    const provider = createProvider('openai', { apiKey: 'test' });
    expect(provider.name).toBe('openai');
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should create Anthropic provider', () => {
    const provider = createProvider('anthropic', { apiKey: 'test' });
    expect(provider.name).toBe('anthropic');
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should create Google provider', () => {
    const provider = createProvider('google', { apiKey: 'test' });
    expect(provider.name).toBe('google');
    expect(provider).toBeInstanceOf(GoogleProvider);
  });

  it('should create Perplexity provider', () => {
    const provider = createProvider('perplexity', { apiKey: 'test' });
    expect(provider.name).toBe('perplexity');
    expect(provider).toBeInstanceOf(PerplexityProvider);
  });

  it('should throw for unknown provider', () => {
    expect(() => {
      // @ts-expect-error Testing invalid input
      createProvider('unknown', { apiKey: 'test' });
    }).toThrow('Unknown provider type');
  });
});

describe('createProviders', () => {
  it('should create multiple providers', () => {
    const providers = createProviders({
      openai: { apiKey: 'openai-key' },
      anthropic: { apiKey: 'anthropic-key' },
    });

    expect(providers.size).toBe(2);
    expect(providers.get('openai')?.name).toBe('openai');
    expect(providers.get('anthropic')?.name).toBe('anthropic');
  });

  it('should create all four providers', () => {
    const providers = createProviders({
      openai: { apiKey: 'openai-key' },
      anthropic: { apiKey: 'anthropic-key' },
      google: { apiKey: 'google-key' },
      perplexity: { apiKey: 'perplexity-key' },
    });

    expect(providers.size).toBe(4);
    expect(providers.get('openai')?.name).toBe('openai');
    expect(providers.get('anthropic')?.name).toBe('anthropic');
    expect(providers.get('google')?.name).toBe('google');
    expect(providers.get('perplexity')?.name).toBe('perplexity');
  });

  it('should create only configured providers', () => {
    const providers = createProviders({
      openai: { apiKey: 'openai-key' },
    });

    expect(providers.size).toBe(1);
    expect(providers.has('openai')).toBe(true);
    expect(providers.has('anthropic')).toBe(false);
    expect(providers.has('google')).toBe(false);
    expect(providers.has('perplexity')).toBe(false);
  });

  it('should create empty map for no configs', () => {
    const providers = createProviders({});
    expect(providers.size).toBe(0);
  });
});

// ================================================================
// INTEGRATION PATTERNS
// ================================================================

describe('Provider Interface', () => {
  it('should be swappable between providers', async () => {
    async function analyzeWithProvider(
      provider: { query: (p: string) => Promise<{ ok: boolean }> },
      prompt: string
    ) {
      return provider.query(prompt);
    }

    const openai = new MockAIProvider('openai');
    const anthropic = new MockAIProvider('anthropic');

    const openaiResult = await analyzeWithProvider(openai, 'Test');
    const anthropicResult = await analyzeWithProvider(anthropic, 'Test');

    expect(openaiResult.ok).toBe(true);
    expect(anthropicResult.ok).toBe(true);
  });

  it('should track token usage consistently', async () => {
    mockFetch
      .mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 },
        })
      )
      .mockResolvedValueOnce(
        createMockResponse(200, {
          content: [{ type: 'text', text: 'OK' }],
          usage: { input_tokens: 50, output_tokens: 25 },
          stop_reason: 'end_turn',
        })
      );

    const openai = new OpenAIProvider({ apiKey: 'test' });
    const anthropic = new AnthropicProvider({ apiKey: 'test' });

    const r1 = await openai.query('Test');
    const r2 = await anthropic.query('Test');

    // Both should have consistent token structure
    if (r1.ok && r2.ok) {
      expect(r1.value.tokensUsed.total).toBe(75);
      expect(r2.value.tokensUsed.total).toBe(75);
    }
  });
});
