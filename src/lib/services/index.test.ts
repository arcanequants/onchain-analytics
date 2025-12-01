/**
 * Service Factory Tests
 *
 * Phase 1, Week 2, Day 5
 * Tests for the Dependency Injection container and service factory.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ServiceContainer,
  ServiceFactory,
  ServiceKeys,
  container,
  type ILogger,
  type ICacheService,
  type IFeatureFlags,
  type IAIOrchestrator,
  type IDatabaseService,
} from './index';

// ================================================================
// MOCK IMPLEMENTATIONS
// ================================================================

const createMockLogger = (): ILogger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  time: vi.fn(() => ({
    success: vi.fn(),
    failure: vi.fn(),
  })),
});

const createMockCache = (): ICacheService => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(async () => {
      store.clear();
    }),
  };
};

const createMockFeatureFlags = (): IFeatureFlags => ({
  isEnabled: vi.fn(() => true),
  getValue: vi.fn(<T>(flag: string, defaultValue: T) => defaultValue),
  getAllFlags: vi.fn(() => ({})),
});

// ================================================================
// SERVICE CONTAINER TESTS
// ================================================================

describe('ServiceContainer', () => {
  let testContainer: ServiceContainer;

  beforeEach(() => {
    testContainer = new ServiceContainer();
  });

  describe('register and resolve', () => {
    it('should register and resolve a service', async () => {
      const mockLogger = createMockLogger();
      testContainer.register('test.logger', () => mockLogger);

      const resolved = await testContainer.resolve<ILogger>('test.logger');
      expect(resolved).toBe(mockLogger);
    });

    it('should register instance directly', async () => {
      const mockLogger = createMockLogger();
      testContainer.registerInstance('test.logger', mockLogger);

      const resolved = await testContainer.resolve<ILogger>('test.logger');
      expect(resolved).toBe(mockLogger);
    });

    it('should throw error for unregistered service', async () => {
      await expect(testContainer.resolve('nonexistent')).rejects.toThrow(
        'Service not registered: nonexistent'
      );
    });
  });

  describe('singleton lifetime', () => {
    it('should return same instance for singleton services', async () => {
      let callCount = 0;
      testContainer.register(
        'test.singleton',
        () => {
          callCount++;
          return { id: callCount };
        },
        'singleton'
      );

      const first = await testContainer.resolve('test.singleton');
      const second = await testContainer.resolve('test.singleton');

      expect(first).toBe(second);
      expect(callCount).toBe(1);
    });

    it('should default to singleton lifetime', async () => {
      let callCount = 0;
      testContainer.register('test.default', () => {
        callCount++;
        return { id: callCount };
      });

      await testContainer.resolve('test.default');
      await testContainer.resolve('test.default');

      expect(callCount).toBe(1);
    });
  });

  describe('transient lifetime', () => {
    it('should return new instance for transient services', async () => {
      let callCount = 0;
      testContainer.register(
        'test.transient',
        () => {
          callCount++;
          return { id: callCount };
        },
        'transient'
      );

      const first = await testContainer.resolve<{ id: number }>('test.transient');
      const second = await testContainer.resolve<{ id: number }>('test.transient');

      expect(first).not.toBe(second);
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  describe('async factory', () => {
    it('should support async factory functions', async () => {
      testContainer.register('test.async', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { async: true };
      });

      const resolved = await testContainer.resolve<{ async: boolean }>('test.async');
      expect(resolved.async).toBe(true);
    });
  });

  describe('circular dependency detection', () => {
    it('should detect circular dependencies', async () => {
      testContainer.register('service.a', async () => {
        await testContainer.resolve('service.b');
        return { name: 'A' };
      });

      testContainer.register('service.b', async () => {
        await testContainer.resolve('service.a');
        return { name: 'B' };
      });

      await expect(testContainer.resolve('service.a')).rejects.toThrow(
        'Circular dependency detected'
      );
    });
  });

  describe('resolveSync', () => {
    it('should resolve initialized singleton synchronously', async () => {
      const mockLogger = createMockLogger();
      testContainer.registerInstance('test.sync', mockLogger);

      const resolved = testContainer.resolveSync<ILogger>('test.sync');
      expect(resolved).toBe(mockLogger);
    });

    it('should throw for uninitialized service', () => {
      testContainer.register('test.uninit', () => ({ value: 1 }));

      expect(() => testContainer.resolveSync('test.uninit')).toThrow(
        'Service not initialized'
      );
    });

    it('should throw for unregistered service', () => {
      expect(() => testContainer.resolveSync('nonexistent')).toThrow(
        'Service not registered'
      );
    });
  });

  describe('container management', () => {
    it('should check if service is registered', () => {
      testContainer.register('test.exists', () => ({}));

      expect(testContainer.has('test.exists')).toBe(true);
      expect(testContainer.has('test.notexists')).toBe(false);
    });

    it('should unregister a service', () => {
      testContainer.register('test.remove', () => ({}));
      expect(testContainer.has('test.remove')).toBe(true);

      testContainer.unregister('test.remove');
      expect(testContainer.has('test.remove')).toBe(false);
    });

    it('should clear all registrations', () => {
      testContainer.register('test.a', () => ({}));
      testContainer.register('test.b', () => ({}));
      testContainer.register('test.c', () => ({}));

      expect(testContainer.getRegisteredServices()).toHaveLength(3);

      testContainer.clear();

      expect(testContainer.getRegisteredServices()).toHaveLength(0);
    });

    it('should reset singleton instances', async () => {
      let callCount = 0;
      testContainer.register('test.reset', () => {
        callCount++;
        return { id: callCount };
      });

      const first = await testContainer.resolve<{ id: number }>('test.reset');
      expect(first.id).toBe(1);

      testContainer.resetInstances();

      const second = await testContainer.resolve<{ id: number }>('test.reset');
      expect(second.id).toBe(2);
      expect(callCount).toBe(2);
    });

    it('should list registered services', () => {
      testContainer.register('alpha', () => ({}));
      testContainer.register('beta', () => ({}));
      testContainer.register('gamma', () => ({}));

      const services = testContainer.getRegisteredServices();
      expect(services).toContain('alpha');
      expect(services).toContain('beta');
      expect(services).toContain('gamma');
      expect(services).toHaveLength(3);
    });
  });
});

// ================================================================
// SERVICE FACTORY TESTS
// ================================================================

describe('ServiceFactory', () => {
  beforeEach(() => {
    ServiceFactory.reset();
  });

  describe('initialization', () => {
    it('should initialize only once', async () => {
      await ServiceFactory.initialize();
      await ServiceFactory.initialize(); // Second call should be no-op

      // Should have registered default services
      expect(container.has(ServiceKeys.LOGGER)).toBe(true);
    });
  });

  describe('mock registration', () => {
    it('should register mock services for testing', async () => {
      // Initialize first, then override with mock
      await ServiceFactory.initialize();

      const mockLogger = createMockLogger();
      ServiceFactory.registerMock(ServiceKeys.LOGGER, mockLogger);

      const resolved = await ServiceFactory.get<ILogger>(ServiceKeys.LOGGER);
      expect(resolved).toBe(mockLogger);
    });

    it('should override existing service with mock', async () => {
      await ServiceFactory.initialize();

      const mockLogger = createMockLogger();
      ServiceFactory.registerMock(ServiceKeys.LOGGER, mockLogger);

      const resolved = await ServiceFactory.get<ILogger>(ServiceKeys.LOGGER);
      expect(resolved).toBe(mockLogger);
    });
  });

  describe('reset', () => {
    it('should reset all services', async () => {
      await ServiceFactory.initialize();
      expect(container.has(ServiceKeys.LOGGER)).toBe(true);

      ServiceFactory.reset();

      expect(container.has(ServiceKeys.LOGGER)).toBe(false);
    });

    it('should allow re-initialization after reset', async () => {
      await ServiceFactory.initialize();
      ServiceFactory.reset();
      await ServiceFactory.initialize();

      expect(container.has(ServiceKeys.LOGGER)).toBe(true);
    });
  });

  describe('resetInstances', () => {
    it('should reset singleton instances but keep registrations', async () => {
      await ServiceFactory.initialize();

      ServiceFactory.resetInstances();

      // Registrations should still exist
      expect(container.has(ServiceKeys.LOGGER)).toBe(true);
    });
  });
});

// ================================================================
// SERVICE KEYS TESTS
// ================================================================

describe('ServiceKeys', () => {
  it('should have all required service keys', () => {
    expect(ServiceKeys.AI_ORCHESTRATOR).toBe('ai.orchestrator');
    expect(ServiceKeys.AI_PROVIDER_OPENAI).toBe('ai.provider.openai');
    expect(ServiceKeys.AI_PROVIDER_ANTHROPIC).toBe('ai.provider.anthropic');
    expect(ServiceKeys.LOGGER).toBe('logger');
    expect(ServiceKeys.LOGGER_API).toBe('logger.api');
    expect(ServiceKeys.LOGGER_AI).toBe('logger.ai');
    expect(ServiceKeys.DATABASE).toBe('database');
    expect(ServiceKeys.FEATURE_FLAGS).toBe('feature.flags');
    expect(ServiceKeys.RATE_LIMITER).toBe('rate.limiter');
    expect(ServiceKeys.CACHE).toBe('cache');
    expect(ServiceKeys.EMAIL).toBe('email');
  });

  it('should have unique values', () => {
    const values = Object.values(ServiceKeys);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

// ================================================================
// GLOBAL CONTAINER TESTS
// ================================================================

describe('Global container', () => {
  beforeEach(() => {
    container.clear();
  });

  it('should be a ServiceContainer instance', () => {
    expect(container).toBeInstanceOf(ServiceContainer);
  });

  it('should be the same instance across imports', () => {
    container.register('test.global', () => ({ global: true }));
    expect(container.has('test.global')).toBe(true);
  });
});

// ================================================================
// CACHE SERVICE INTEGRATION TESTS
// ================================================================

describe('Cache Service (in-memory implementation)', () => {
  beforeEach(() => {
    ServiceFactory.reset();
  });

  it('should register cache service', async () => {
    await ServiceFactory.initialize();

    const cache = await ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);
    expect(cache).toBeDefined();
    expect(cache.get).toBeDefined();
    expect(cache.set).toBeDefined();
    expect(cache.delete).toBeDefined();
    expect(cache.clear).toBeDefined();
  });

  it('should store and retrieve values', async () => {
    await ServiceFactory.initialize();

    const cache = await ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);

    await cache.set('test-key', { data: 'test-value' });
    const value = await cache.get<{ data: string }>('test-key');

    expect(value).toEqual({ data: 'test-value' });
  });

  it('should return null for missing keys', async () => {
    await ServiceFactory.initialize();

    const cache = await ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);
    const value = await cache.get('nonexistent');

    expect(value).toBeNull();
  });

  it('should delete values', async () => {
    await ServiceFactory.initialize();

    const cache = await ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);

    await cache.set('to-delete', 'value');
    await cache.delete('to-delete');
    const value = await cache.get('to-delete');

    expect(value).toBeNull();
  });

  it('should clear all values', async () => {
    await ServiceFactory.initialize();

    const cache = await ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);

    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.clear();

    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBeNull();
  });

  it('should expire values after TTL', async () => {
    await ServiceFactory.initialize();

    const cache = await ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);

    // Set with 1 second TTL
    await cache.set('expiring', 'value', 0.05); // 50ms TTL

    // Should exist immediately
    expect(await cache.get('expiring')).toBe('value');

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Should be expired
    expect(await cache.get('expiring')).toBeNull();
  });
});

// ================================================================
// TYPE SAFETY TESTS
// ================================================================

describe('Type Safety', () => {
  beforeEach(() => {
    container.clear();
  });

  it('should maintain type safety with generics', async () => {
    interface CustomService {
      doSomething(): string;
    }

    const mockService: CustomService = {
      doSomething: () => 'done',
    };

    container.registerInstance('custom', mockService);
    const resolved = await container.resolve<CustomService>('custom');

    // TypeScript should infer correct type
    const result: string = resolved.doSomething();
    expect(result).toBe('done');
  });
});
