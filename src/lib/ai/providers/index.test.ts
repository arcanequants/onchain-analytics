/**
 * AI Provider Clients Tests
 * Phase 1, Week 1, Day 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
  OpenAIProvider,
  AnthropicProvider,
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

  it('should create only configured providers', () => {
    const providers = createProviders({
      openai: { apiKey: 'openai-key' },
    });

    expect(providers.size).toBe(1);
    expect(providers.has('openai')).toBe(true);
    expect(providers.has('anthropic')).toBe(false);
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
