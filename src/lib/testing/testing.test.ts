/**
 * Testing Utilities Tests
 *
 * Tests for factories, mocks, fixtures, and utility functions
 *
 * Phase 3, Week 10, Day 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Factories
  createFactory,
  userFactory,
  analysisFactory,
  aiResponseFactory,
  subscriptionFactory,
  recommendationFactory,
  apiKeyFactory,
  webhookFactory,
  generateUUID,
  randomEmail,
  randomUrl,
  randomScore,
  dateOffset,
  randomPick,

  // Mocks
  createMockFetch,
  mockGlobalFetch,
  restoreGlobalFetch,
  createTimerMocks,
  createMockStorage,
  mockLocalStorage,
  mockSessionStorage,
  mockConsole,
  createMockEvent,
  createMockKeyboardEvent,
  createMockMouseEvent,
  createMockDatabase,
  createMockAIProvider,
  createMockRequest,
  createMockNextResponse,
  createMockSupabaseClient,

  // Fixtures
  fixtures,
  scenarios,

  // Utilities
  waitFor,
  delay,
  createDeferred,
  retry,
  expectReject,
  createSpy,
  deepFreeze,
  createTestContext,
  assertHasKeys,
  assertInRange,
  assertSameElements,
  assertApproxEqual,
} from './index';

// ================================================================
// FACTORY TESTS
// ================================================================

describe('Testing Utilities', () => {
  describe('Factories', () => {
    describe('createFactory', () => {
      it('should create factory with defaults', () => {
        interface TestEntity {
          id: number;
          name: string;
        }

        const factory = createFactory<TestEntity>({
          defaults: (seq) => ({
            id: seq,
            name: `Entity ${seq}`,
          }),
        });

        const entity = factory();
        expect(entity.id).toBe(1);
        expect(entity.name).toBe('Entity 1');
      });

      it('should apply overrides', () => {
        interface TestEntity {
          id: number;
          name: string;
        }

        const factory = createFactory<TestEntity>({
          defaults: (seq) => ({
            id: seq,
            name: `Entity ${seq}`,
          }),
        });

        const entity = factory({ overrides: { name: 'Custom Name' } });
        expect(entity.name).toBe('Custom Name');
      });

      it('should apply traits', () => {
        interface TestEntity {
          id: number;
          status: string;
        }

        const factory = createFactory<TestEntity>({
          defaults: (seq) => ({
            id: seq,
            status: 'pending',
          }),
          traits: {
            completed: { status: 'completed' },
            failed: { status: 'failed' },
          },
        });

        const entity = factory({ traits: ['completed'] });
        expect(entity.status).toBe('completed');
      });

      it('should build multiple entities', () => {
        interface TestEntity {
          id: number;
        }

        const factory = createFactory<TestEntity>({
          defaults: (seq) => ({ id: seq }),
        });

        const entities = factory.buildList(5);
        expect(entities).toHaveLength(5);
        expect(entities.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
      });

      it('should reset sequence', () => {
        interface TestEntity {
          id: number;
        }

        const factory = createFactory<TestEntity>({
          defaults: (seq) => ({ id: seq }),
        });

        factory();
        factory();
        factory.resetSequence();
        const entity = factory();
        expect(entity.id).toBe(1);
      });
    });

    describe('userFactory', () => {
      beforeEach(() => {
        userFactory.resetSequence();
      });

      it('should create user with defaults', () => {
        const user = userFactory();
        expect(user.id).toBeDefined();
        expect(user.email).toContain('@example.com');
        expect(user.plan).toBe('free');
        expect(user.analyses_count).toBe(0);
      });

      it('should apply starter trait', () => {
        const user = userFactory({ traits: ['starter'] });
        expect(user.plan).toBe('starter');
      });

      it('should apply pro trait', () => {
        const user = userFactory({ traits: ['pro'] });
        expect(user.plan).toBe('pro');
      });

      it('should apply power trait', () => {
        const user = userFactory({ traits: ['power'] });
        expect(user.plan).toBe('pro');
        expect(user.analyses_count).toBe(50);
      });
    });

    describe('analysisFactory', () => {
      beforeEach(() => {
        analysisFactory.resetSequence();
      });

      it('should create analysis with defaults', () => {
        const analysis = analysisFactory();
        expect(analysis.id).toBeDefined();
        expect(analysis.url).toContain('https://');
        expect(analysis.status).toBe('completed');
        expect(analysis.overall_score).toBeGreaterThanOrEqual(50);
      });

      it('should apply pending trait', () => {
        const analysis = analysisFactory({ traits: ['pending'] });
        expect(analysis.status).toBe('pending');
        expect(analysis.overall_score).toBeNull();
      });

      it('should apply anonymous trait', () => {
        const analysis = analysisFactory({ traits: ['anonymous'] });
        expect(analysis.user_id).toBeNull();
      });
    });

    describe('aiResponseFactory', () => {
      beforeEach(() => {
        aiResponseFactory.resetSequence();
      });

      it('should create AI response with defaults', () => {
        const response = aiResponseFactory();
        expect(response.id).toBeDefined();
        expect(response.mentions_brand).toBe(true);
        expect(response.sentiment).toBe('positive');
      });

      it('should apply notMentioned trait', () => {
        const response = aiResponseFactory({ traits: ['notMentioned'] });
        expect(response.mentions_brand).toBe(false);
        expect(response.recommends).toBe(false);
        expect(response.position).toBeNull();
      });

      it('should apply negative trait', () => {
        const response = aiResponseFactory({ traits: ['negative'] });
        expect(response.sentiment).toBe('negative');
        expect(response.recommends).toBe(false);
      });
    });

    describe('subscriptionFactory', () => {
      beforeEach(() => {
        subscriptionFactory.resetSequence();
      });

      it('should create subscription with defaults', () => {
        const sub = subscriptionFactory();
        expect(sub.id).toBeDefined();
        expect(sub.status).toBe('active');
        expect(sub.plan).toBe('starter');
      });

      it('should apply pro trait', () => {
        const sub = subscriptionFactory({ traits: ['pro'] });
        expect(sub.plan).toBe('pro');
      });

      it('should apply canceled trait', () => {
        const sub = subscriptionFactory({ traits: ['canceled'] });
        expect(sub.status).toBe('canceled');
      });
    });

    describe('recommendationFactory', () => {
      beforeEach(() => {
        recommendationFactory.resetSequence();
      });

      it('should create recommendation with defaults', () => {
        const rec = recommendationFactory();
        expect(rec.id).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.priority).toBeGreaterThanOrEqual(1);
        expect(rec.priority).toBeLessThanOrEqual(5);
      });

      it('should apply quickWin trait', () => {
        const rec = recommendationFactory({ traits: ['quickWin'] });
        expect(rec.impact_score).toBe(8);
        expect(rec.effort_score).toBe(2);
        expect(rec.priority).toBe(1);
      });
    });

    describe('apiKeyFactory', () => {
      beforeEach(() => {
        apiKeyFactory.resetSequence();
      });

      it('should create API key with defaults', () => {
        const key = apiKeyFactory();
        expect(key.id).toBeDefined();
        expect(key.key_prefix).toMatch(/^aip_/);
        expect(key.scopes).toContain('analyze:read');
      });

      it('should apply expired trait', () => {
        const key = apiKeyFactory({ traits: ['expired'] });
        const expiresAt = new Date(key.expires_at!);
        expect(expiresAt.getTime()).toBeLessThan(Date.now());
      });

      it('should apply readOnly trait', () => {
        const key = apiKeyFactory({ traits: ['readOnly'] });
        expect(key.scopes).toEqual(['analyze:read']);
      });
    });

    describe('webhookFactory', () => {
      beforeEach(() => {
        webhookFactory.resetSequence();
      });

      it('should create webhook with defaults', () => {
        const webhook = webhookFactory();
        expect(webhook.id).toBeDefined();
        expect(webhook.url).toContain('https://');
        expect(webhook.active).toBe(true);
        expect(webhook.failure_count).toBe(0);
      });

      it('should apply failing trait', () => {
        const webhook = webhookFactory({ traits: ['failing'] });
        expect(webhook.failure_count).toBe(5);
      });
    });

    describe('Helper Functions', () => {
      it('generateUUID should create valid UUIDs', () => {
        const uuid = generateUUID();
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
      });

      it('randomEmail should create valid emails', () => {
        const email = randomEmail();
        expect(email).toMatch(/^[a-z0-9]+@example\.com$/);
      });

      it('randomEmail should use custom domain', () => {
        const email = randomEmail('test.io');
        expect(email).toContain('@test.io');
      });

      it('randomUrl should create valid URLs', () => {
        const url = randomUrl();
        expect(url).toMatch(/^https:\/\/[a-z]+\.[a-z]+$/);
      });

      it('randomScore should be within range', () => {
        const score = randomScore(10, 50);
        expect(score).toBeGreaterThanOrEqual(10);
        expect(score).toBeLessThanOrEqual(50);
      });

      it('dateOffset should return correct offset', () => {
        const future = dateOffset(7);
        const futureDate = new Date(future);
        const now = new Date();
        const diffDays = Math.round(
          (futureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(diffDays).toBe(7);
      });

      it('randomPick should return item from array', () => {
        const items = ['a', 'b', 'c'];
        const picked = randomPick(items);
        expect(items).toContain(picked);
      });
    });
  });

  // ================================================================
  // MOCK TESTS
  // ================================================================

  describe('Mocks', () => {
    describe('createMockFetch', () => {
      it('should return mock response', async () => {
        const mockFetch = createMockFetch({
          status: 200,
          body: { data: 'test' },
        });

        const response = await mockFetch('https://api.example.com');
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(data).toEqual({ data: 'test' });
      });

      it('should throw on error response', async () => {
        const mockFetch = createMockFetch({
          error: new Error('Network error'),
        });

        await expect(mockFetch('https://api.example.com')).rejects.toThrow(
          'Network error'
        );
      });

      it('should return queued responses in order', async () => {
        const mockFetch = createMockFetch([
          { body: { count: 1 } },
          { body: { count: 2 } },
        ]);

        const res1 = await mockFetch('url1');
        const res2 = await mockFetch('url2');

        expect(await res1.json()).toEqual({ count: 1 });
        expect(await res2.json()).toEqual({ count: 2 });
      });
    });

    describe('mockGlobalFetch', () => {
      afterEach(() => {
        restoreGlobalFetch();
      });

      it('should replace global fetch', async () => {
        mockGlobalFetch({ body: { mocked: true } });

        const response = await fetch('https://test.com');
        const data = await response.json();

        expect(data).toEqual({ mocked: true });
      });
    });

    describe('createTimerMocks', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      it('should control time', () => {
        const timers = createTimerMocks();
        let called = false;

        setTimeout(() => {
          called = true;
        }, 1000);

        expect(called).toBe(false);
        timers.advanceTime(1000);
        expect(called).toBe(true);

        timers.restore();
      });

      it('should set system time', () => {
        const timers = createTimerMocks();
        const fixedDate = new Date('2024-01-15T12:00:00Z');

        timers.setSystemTime(fixedDate);
        expect(new Date().toISOString()).toBe(fixedDate.toISOString());

        timers.restore();
      });
    });

    describe('createMockStorage', () => {
      it('should store and retrieve items', () => {
        const storage = createMockStorage();

        storage.setItem('key', 'value');
        expect(storage.getItem('key')).toBe('value');
      });

      it('should return null for missing items', () => {
        const storage = createMockStorage();
        expect(storage.getItem('missing')).toBeNull();
      });

      it('should remove items', () => {
        const storage = createMockStorage();

        storage.setItem('key', 'value');
        storage.removeItem('key');
        expect(storage.getItem('key')).toBeNull();
      });

      it('should clear all items', () => {
        const storage = createMockStorage();

        storage.setItem('key1', 'value1');
        storage.setItem('key2', 'value2');
        storage.clear();

        expect(storage.length).toBe(0);
      });
    });

    describe('mockLocalStorage', () => {
      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('should replace global localStorage', () => {
        const storage = mockLocalStorage();

        localStorage.setItem('test', 'data');
        expect(localStorage.getItem('test')).toBe('data');
        expect(storage.setItem).toHaveBeenCalled();
      });
    });

    describe('mockConsole', () => {
      it('should capture console calls', () => {
        const mocks = mockConsole();

        console.log('test log');
        console.warn('test warn');
        console.error('test error');

        expect(mocks.log).toHaveBeenCalledWith('test log');
        expect(mocks.warn).toHaveBeenCalledWith('test warn');
        expect(mocks.error).toHaveBeenCalledWith('test error');

        mocks.restore();
      });
    });

    describe('createMockEvent', () => {
      it('should create event with type', () => {
        const event = createMockEvent('click');
        expect(event.type).toBe('click');
      });

      it('should allow preventDefault', () => {
        const event = createMockEvent('submit');
        event.preventDefault();
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('createMockKeyboardEvent', () => {
      it('should create keyboard event', () => {
        const event = createMockKeyboardEvent('keydown', 'Enter');
        expect(event.type).toBe('keydown');
        expect(event.key).toBe('Enter');
      });

      it('should include modifier keys', () => {
        const event = createMockKeyboardEvent('keydown', 'a', {
          ctrlKey: true,
          shiftKey: true,
        });
        expect(event.ctrlKey).toBe(true);
        expect(event.shiftKey).toBe(true);
      });
    });

    describe('createMockMouseEvent', () => {
      it('should create mouse event', () => {
        const event = createMockMouseEvent('click', {
          clientX: 100,
          clientY: 200,
        });
        expect(event.type).toBe('click');
        expect(event.clientX).toBe(100);
        expect(event.clientY).toBe(200);
      });
    });

    describe('createMockDatabase', () => {
      it('should provide mock query method', async () => {
        const db = createMockDatabase();
        const result = await db.query('SELECT * FROM users');
        expect(result).toEqual({ rows: [], count: 0 });
      });

      it('should provide mock insert method', async () => {
        const db = createMockDatabase();
        const result = await db.insert({ name: 'test' });
        expect(result).toEqual({ id: 'mock-id' });
      });

      it('should support transactions', async () => {
        const db = createMockDatabase();
        const result = await db.transaction(async (tx) => {
          await tx.insert({ name: 'test' });
          return 'done';
        });
        expect(result).toBe('done');
      });
    });

    describe('createMockAIProvider', () => {
      it('should provide mock complete method', async () => {
        const ai = createMockAIProvider('Test response');
        const result = await ai.complete('prompt');
        expect(result.text).toBe('Test response');
        expect(result.usage).toBeDefined();
      });

      it('should provide mock chat method', async () => {
        const ai = createMockAIProvider('Chat response');
        const result = await ai.chat([{ role: 'user', content: 'Hi' }]);
        expect(result.message.content).toBe('Chat response');
      });

      it('should provide mock embed method', async () => {
        const ai = createMockAIProvider();
        const result = await ai.embed('text');
        expect(result.embedding).toHaveLength(1536);
      });
    });

    describe('createMockRequest', () => {
      it('should create GET request', () => {
        const request = createMockRequest('https://api.example.com/users');
        expect(request.method).toBe('GET');
        expect(request.url).toBe('https://api.example.com/users');
      });

      it('should create POST request with body', async () => {
        const request = createMockRequest('https://api.example.com/users', {
          method: 'POST',
          body: { name: 'Test' },
        });
        expect(request.method).toBe('POST');
        const body = await request.json();
        expect(body).toEqual({ name: 'Test' });
      });
    });

    describe('createMockNextResponse', () => {
      it('should create json response', () => {
        const NextResponse = createMockNextResponse();
        const response = NextResponse.json({ data: 'test' });
        expect(response).toBeInstanceOf(Response);
      });

      it('should create redirect response', () => {
        const NextResponse = createMockNextResponse();
        const response = NextResponse.redirect('/login');
        expect(response.status).toBe(307);
        expect(response.headers.get('Location')).toBe('/login');
      });
    });

    describe('createMockSupabaseClient', () => {
      it('should provide chainable from method', () => {
        const supabase = createMockSupabaseClient();
        const query = supabase.from('users').select('*').eq('id', '1');
        expect(query.single).toBeDefined();
      });

      it('should provide auth methods', async () => {
        const supabase = createMockSupabaseClient();
        const { data, error } = await supabase.auth.getUser();
        expect(error).toBeNull();
        expect(data.user).toBeNull();
      });

      it('should provide rpc method', async () => {
        const supabase = createMockSupabaseClient();
        const { error } = await supabase.rpc('function_name');
        expect(error).toBeNull();
      });
    });
  });

  // ================================================================
  // FIXTURE TESTS
  // ================================================================

  describe('Fixtures', () => {
    describe('User Fixtures', () => {
      it('should create free user', () => {
        const user = fixtures.users.freeUser();
        expect(user.plan).toBe('free');
        expect(user.analyses_count).toBe(0);
      });

      it('should create starter user', () => {
        const user = fixtures.users.starterUser();
        expect(user.plan).toBe('starter');
        expect(user.analyses_count).toBe(15);
      });

      it('should create pro user', () => {
        const user = fixtures.users.proUser();
        expect(user.plan).toBe('pro');
        expect(user.analyses_count).toBe(100);
      });
    });

    describe('Analysis Fixtures', () => {
      it('should create high score analysis', () => {
        const analysis = fixtures.analyses.highScore();
        expect(analysis.overall_score).toBe(85);
        expect(analysis.status).toBe('completed');
      });

      it('should create low score analysis', () => {
        const analysis = fixtures.analyses.lowScore();
        expect(analysis.overall_score).toBe(25);
      });

      it('should create in-progress analysis', () => {
        const analysis = fixtures.analyses.inProgress();
        expect(analysis.status).toBe('processing');
        expect(analysis.overall_score).toBeNull();
      });

      it('should create failed analysis', () => {
        const analysis = fixtures.analyses.failed();
        expect(analysis.status).toBe('failed');
      });
    });

    describe('AI Response Fixtures', () => {
      it('should create OpenAI positive response', () => {
        const response = fixtures.aiResponses.openaiPositive();
        expect(response.provider).toBe('openai');
        expect(response.sentiment).toBe('positive');
        expect(response.recommends).toBe(true);
      });

      it('should create Anthropic negative response', () => {
        const response = fixtures.aiResponses.anthropicNegative();
        expect(response.provider).toBe('anthropic');
        expect(response.sentiment).toBe('negative');
        expect(response.recommends).toBe(false);
      });

      it('should create not mentioned response', () => {
        const response = fixtures.aiResponses.notMentioned();
        expect(response.mentions_brand).toBe(false);
        expect(response.position).toBeNull();
      });
    });

    describe('Subscription Fixtures', () => {
      it('should create active starter subscription', () => {
        const sub = fixtures.subscriptions.activeStarter();
        expect(sub.plan).toBe('starter');
        expect(sub.status).toBe('active');
      });

      it('should create canceled subscription', () => {
        const sub = fixtures.subscriptions.canceled();
        expect(sub.status).toBe('canceled');
      });
    });

    describe('Recommendation Fixtures', () => {
      it('should create quick win recommendation', () => {
        const rec = fixtures.recommendations.quickWin();
        expect(rec.impact_score).toBe(9);
        expect(rec.effort_score).toBe(2);
        expect(rec.priority).toBe(1);
      });
    });

    describe('API Key Fixtures', () => {
      it('should create valid key', () => {
        const key = fixtures.apiKeys.validKey();
        expect(key.scopes).toContain('analyze:read');
        expect(key.scopes).toContain('analyze:write');
      });

      it('should create expired key', () => {
        const key = fixtures.apiKeys.expiredKey();
        const expiresAt = new Date(key.expires_at!);
        expect(expiresAt.getTime()).toBeLessThan(Date.now());
      });

      it('should create rate limited key', () => {
        const key = fixtures.apiKeys.rateLimitedKey();
        expect(key.usage_count).toBe(key.rate_limit);
      });
    });

    describe('Webhook Fixtures', () => {
      it('should create active webhook', () => {
        const webhook = fixtures.webhooks.activeWebhook();
        expect(webhook.active).toBe(true);
        expect(webhook.failure_count).toBe(0);
      });

      it('should create failing webhook', () => {
        const webhook = fixtures.webhooks.failingWebhook();
        expect(webhook.failure_count).toBe(5);
      });
    });
  });

  // ================================================================
  // SCENARIO TESTS
  // ================================================================

  describe('Scenarios', () => {
    it('should create new user first analysis scenario', () => {
      const scenario = scenarios.newUserFirstAnalysis();
      expect(scenario.user.plan).toBe('free');
      expect(scenario.analysis.user_id).toBe(scenario.user.id);
      expect(scenario.analysis.status).toBe('pending');
    });

    it('should create completed analysis with responses scenario', () => {
      const scenario = scenarios.completedAnalysisWithResponses();
      expect(scenario.user).toBeDefined();
      expect(scenario.analysis).toBeDefined();
      expect(scenario.responses).toHaveLength(2);
      expect(scenario.recommendations).toHaveLength(3);
    });

    it('should create pro user with subscription scenario', () => {
      const scenario = scenarios.proUserWithSubscription();
      expect(scenario.user.plan).toBe('pro');
      expect(scenario.subscription.user_id).toBe(scenario.user.id);
      expect(scenario.apiKey.user_id).toBe(scenario.user.id);
      expect(scenario.webhook.user_id).toBe(scenario.user.id);
    });

    it('should create user at rate limit scenario', () => {
      const scenario = scenarios.userAtRateLimit();
      expect(scenario.user.plan).toBe('free');
      expect(scenario.analyses).toHaveLength(5);
      expect(scenario.limitReached).toBe(true);
    });

    it('should create analysis comparison scenario', () => {
      const scenario = scenarios.analysisComparison();
      expect(scenario.before.overall_score).toBe(45);
      expect(scenario.after.overall_score).toBe(72);
      expect(scenario.improvement).toBe(27);
      expect(scenario.before.url).toBe(scenario.after.url);
    });
  });

  // ================================================================
  // UTILITY TESTS
  // ================================================================

  describe('Utilities', () => {
    describe('waitFor', () => {
      it('should wait for condition to be true', async () => {
        let ready = false;
        setTimeout(() => {
          ready = true;
        }, 50);

        await waitFor(() => ready);
        expect(ready).toBe(true);
      });

      it('should timeout if condition never true', async () => {
        await expect(
          waitFor(() => false, { timeout: 100 })
        ).rejects.toThrow('timed out');
      });
    });

    describe('delay', () => {
      it('should wait for specified time', async () => {
        const start = Date.now();
        await delay(50);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(45);
      });
    });

    describe('createDeferred', () => {
      it('should resolve when resolve is called', async () => {
        const deferred = createDeferred<string>();

        setTimeout(() => {
          deferred.resolve('done');
        }, 10);

        const result = await deferred.promise;
        expect(result).toBe('done');
      });

      it('should reject when reject is called', async () => {
        const deferred = createDeferred<string>();

        setTimeout(() => {
          deferred.reject(new Error('failed'));
        }, 10);

        await expect(deferred.promise).rejects.toThrow('failed');
      });
    });

    describe('retry', () => {
      it('should succeed on first try', async () => {
        const result = await retry(async () => 'success');
        expect(result).toBe('success');
      });

      it('should retry on failure', async () => {
        let attempts = 0;
        const result = await retry(
          async () => {
            attempts++;
            if (attempts < 3) throw new Error('not yet');
            return 'success';
          },
          { maxRetries: 5, delay: 10 }
        );
        expect(result).toBe('success');
        expect(attempts).toBe(3);
      });

      it('should throw after max retries', async () => {
        await expect(
          retry(
            async () => {
              throw new Error('always fails');
            },
            { maxRetries: 2, delay: 10 }
          )
        ).rejects.toThrow('always fails');
      });
    });

    describe('expectReject', () => {
      it('should pass when promise rejects', async () => {
        const error = await expectReject(Promise.reject(new Error('test')));
        expect(error.message).toBe('test');
      });

      it('should fail when promise resolves', async () => {
        await expect(
          expectReject(Promise.resolve('success'))
        ).rejects.toThrow('Expected promise to reject');
      });

      it('should check error message', async () => {
        await expectReject(
          Promise.reject(new Error('specific error')),
          'specific'
        );
      });

      it('should check error with regex', async () => {
        await expectReject(
          Promise.reject(new Error('error 123')),
          /error \d+/
        );
      });
    });

    describe('createSpy', () => {
      it('should track calls', () => {
        const spy = createSpy((x: number) => x * 2);

        spy(1);
        spy(2);
        spy(3);

        expect(spy.callCount).toBe(3);
        expect(spy.calls).toEqual([[1], [2], [3]]);
        expect(spy.results).toEqual([2, 4, 6]);
      });

      it('should provide lastCall and lastResult', () => {
        const spy = createSpy((x: number) => x + 1);

        spy(5);
        spy(10);

        expect(spy.lastCall).toEqual([10]);
        expect(spy.lastResult).toBe(11);
      });

      it('should reset', () => {
        const spy = createSpy();

        spy(1);
        spy(2);
        spy.reset();

        expect(spy.callCount).toBe(0);
        expect(spy.calls).toEqual([]);
      });
    });

    describe('deepFreeze', () => {
      it('should freeze object', () => {
        const obj = deepFreeze({ a: 1, b: { c: 2 } });

        expect(() => {
          (obj as { a: number }).a = 2;
        }).toThrow();
      });

      it('should freeze nested objects', () => {
        const obj = deepFreeze({ nested: { value: 1 } });

        expect(() => {
          (obj.nested as { value: number }).value = 2;
        }).toThrow();
      });

      it('should handle primitives', () => {
        expect(deepFreeze(5)).toBe(5);
        expect(deepFreeze('test')).toBe('test');
        expect(deepFreeze(null)).toBe(null);
      });
    });

    describe('createTestContext', () => {
      it('should setup and teardown', async () => {
        let teardownCalled = false;

        const context = createTestContext(
          () => ({ value: 42 }),
          () => {
            teardownCalled = true;
          }
        );

        await context.before();
        expect(context.get().value).toBe(42);

        await context.after();
        expect(teardownCalled).toBe(true);
      });

      it('should throw if get called before before', () => {
        const context = createTestContext(() => ({ value: 1 }));

        expect(() => context.get()).toThrow('not initialized');
      });
    });

    describe('Assertion Helpers', () => {
      describe('assertHasKeys', () => {
        it('should pass when keys exist', () => {
          expect(() => {
            assertHasKeys({ a: 1, b: 2 }, ['a', 'b']);
          }).not.toThrow();
        });

        it('should fail when keys missing', () => {
          expect(() => {
            assertHasKeys({ a: 1 }, ['a', 'b']);
          }).toThrow('key "b"');
        });
      });

      describe('assertInRange', () => {
        it('should pass when in range', () => {
          expect(() => assertInRange(5, 0, 10)).not.toThrow();
        });

        it('should fail when out of range', () => {
          expect(() => assertInRange(15, 0, 10)).toThrow();
        });
      });

      describe('assertSameElements', () => {
        it('should pass for same elements', () => {
          expect(() => {
            assertSameElements([1, 2, 3], [3, 1, 2]);
          }).not.toThrow();
        });

        it('should fail for different elements', () => {
          expect(() => {
            assertSameElements([1, 2, 3], [1, 2, 4]);
          }).toThrow();
        });

        it('should fail for different lengths', () => {
          expect(() => {
            assertSameElements([1, 2], [1, 2, 3]);
          }).toThrow('length mismatch');
        });
      });

      describe('assertApproxEqual', () => {
        it('should pass for approximately equal values', () => {
          expect(() => {
            assertApproxEqual(0.1 + 0.2, 0.3);
          }).not.toThrow();
        });

        it('should fail for significantly different values', () => {
          expect(() => {
            assertApproxEqual(1.0, 1.1);
          }).toThrow();
        });

        it('should use custom epsilon', () => {
          expect(() => {
            assertApproxEqual(1.0, 1.1, 0.2);
          }).not.toThrow();
        });
      });
    });
  });
});
