/**
 * Service Factory - Dependency Injection Container
 *
 * Phase 1, Week 2, Day 5
 * Implements a lightweight DI container for service management.
 *
 * Features:
 * - Service registration with interfaces
 * - Singleton and transient lifetimes
 * - Lazy initialization
 * - Easy mocking for tests
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAIProvider, QueryOptions, AIResponse } from '../ai/providers';
import type { Result } from '../result';
import type { AIProviderError, AppError } from '../errors';
import type { OrchestratorResult } from '../ai/orchestrator';

// ================================================================
// SERVICE INTERFACES
// ================================================================

/**
 * AI Orchestrator Service Interface
 */
export interface IAIOrchestrator {
  query(prompt: string, options?: QueryOptions): Promise<Result<OrchestratorResult, AppError>>;
  healthCheck(): Promise<Map<string, boolean>>;
  getAvailableProviders(): Promise<string[]>;
}

/**
 * Logger Service Interface
 */
export interface ILogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  time(operation: string): {
    success(context?: Record<string, unknown>): void;
    failure(error: Error, context?: Record<string, unknown>): void;
  };
}

/**
 * Database Service Interface
 */
export interface IDatabaseService {
  getClient(): SupabaseClient;
  isHealthy(): Promise<boolean>;
}

/**
 * Feature Flags Service Interface
 */
export interface IFeatureFlags {
  isEnabled(flag: string): boolean;
  getValue<T>(flag: string, defaultValue: T): T;
  getAllFlags(): Record<string, boolean | string | number>;
}

/**
 * Rate Limiter Service Interface
 */
export interface IRateLimiter {
  check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }>;
  reset(identifier: string): Promise<void>;
}

/**
 * Cache Service Interface
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Email Service Interface
 */
export interface IEmailService {
  send(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<Result<{ id: string }, Error>>;
}

// ================================================================
// SERVICE LIFETIME
// ================================================================

export type ServiceLifetime = 'singleton' | 'transient';

// ================================================================
// SERVICE REGISTRY
// ================================================================

interface ServiceRegistration<T> {
  factory: () => T | Promise<T>;
  lifetime: ServiceLifetime;
  instance?: T;
}

/**
 * Service Container - Manages service registration and resolution
 */
class ServiceContainer {
  private services = new Map<string, ServiceRegistration<unknown>>();
  private resolving = new Set<string>();

  /**
   * Register a service with a factory function
   */
  register<T>(
    name: string,
    factory: () => T | Promise<T>,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    this.services.set(name, {
      factory,
      lifetime,
      instance: undefined,
    });
  }

  /**
   * Register a singleton instance directly
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, {
      factory: () => instance,
      lifetime: 'singleton',
      instance,
    });
  }

  /**
   * Resolve a service by name
   */
  async resolve<T>(name: string): Promise<T> {
    const registration = this.services.get(name);

    if (!registration) {
      throw new Error(`Service not registered: ${name}`);
    }

    // Detect circular dependencies
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected for service: ${name}`);
    }

    // Return cached instance for singletons
    if (registration.lifetime === 'singleton' && registration.instance !== undefined) {
      return registration.instance as T;
    }

    // Create new instance
    this.resolving.add(name);
    try {
      const instance = await registration.factory();

      // Cache singleton instances
      if (registration.lifetime === 'singleton') {
        registration.instance = instance;
      }

      return instance as T;
    } finally {
      this.resolving.delete(name);
    }
  }

  /**
   * Resolve a service synchronously (only for already-initialized singletons)
   */
  resolveSync<T>(name: string): T {
    const registration = this.services.get(name);

    if (!registration) {
      throw new Error(`Service not registered: ${name}`);
    }

    if (registration.instance === undefined) {
      throw new Error(`Service not initialized. Use resolve() for async initialization: ${name}`);
    }

    return registration.instance as T;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Remove a service registration
   */
  unregister(name: string): void {
    this.services.delete(name);
  }

  /**
   * Clear all registrations (useful for tests)
   */
  clear(): void {
    this.services.clear();
    this.resolving.clear();
  }

  /**
   * Reset singleton instances (useful for tests)
   */
  resetInstances(): void {
    for (const registration of this.services.values()) {
      registration.instance = undefined;
    }
  }

  /**
   * Get list of registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

// ================================================================
// GLOBAL CONTAINER
// ================================================================

export const container = new ServiceContainer();

// ================================================================
// SERVICE KEYS
// ================================================================

export const ServiceKeys = {
  AI_ORCHESTRATOR: 'ai.orchestrator',
  AI_PROVIDER_OPENAI: 'ai.provider.openai',
  AI_PROVIDER_ANTHROPIC: 'ai.provider.anthropic',
  LOGGER: 'logger',
  LOGGER_API: 'logger.api',
  LOGGER_AI: 'logger.ai',
  DATABASE: 'database',
  FEATURE_FLAGS: 'feature.flags',
  RATE_LIMITER: 'rate.limiter',
  CACHE: 'cache',
  EMAIL: 'email',
} as const;

export type ServiceKey = (typeof ServiceKeys)[keyof typeof ServiceKeys];

// ================================================================
// SERVICE FACTORY
// ================================================================

/**
 * ServiceFactory - High-level API for service management
 */
export class ServiceFactory {
  private static initialized = false;

  /**
   * Initialize all default services
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Register default services lazily
    await this.registerDefaultServices();
    this.initialized = true;
  }

  /**
   * Register default service implementations
   */
  private static async registerDefaultServices(): Promise<void> {
    // Logger services
    const { apiLogger, aiLogger, createLogger } = await import('../logger');
    container.registerInstance(ServiceKeys.LOGGER, createLogger('app'));
    container.registerInstance(ServiceKeys.LOGGER_API, apiLogger);
    container.registerInstance(ServiceKeys.LOGGER_AI, aiLogger);

    // Feature flags
    container.register(ServiceKeys.FEATURE_FLAGS, async () => {
      const { FeatureFlags } = await import('../feature-flags');
      return FeatureFlags;
    });

    // AI Orchestrator (lazy - requires API keys)
    container.register(ServiceKeys.AI_ORCHESTRATOR, async () => {
      const { createOrchestrator } = await import('../ai/orchestrator');
      const { serverEnv } = await import('../env');

      return createOrchestrator({
        openaiApiKey: serverEnv.OPENAI_API_KEY,
        anthropicApiKey: serverEnv.ANTHROPIC_API_KEY,
        mode: 'fallback',
        enableCircuitBreaker: true,
      });
    });

    // Database (lazy)
    container.register(ServiceKeys.DATABASE, async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const { clientEnv } = await import('../env');

      const supabaseUrl = clientEnv.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      return {
        getClient: () => createClient(supabaseUrl, supabaseAnonKey),
        isHealthy: async () => {
          try {
            const client = createClient(supabaseUrl, supabaseAnonKey);
            const { error } = await client.from('_health').select('1').limit(1);
            return !error;
          } catch {
            return false;
          }
        },
      } as IDatabaseService;
    });

    // In-memory cache (simple implementation)
    container.register(ServiceKeys.CACHE, () => {
      const cache = new Map<string, { value: unknown; expiresAt: number }>();

      return {
        get: async <T>(key: string): Promise<T | null> => {
          const entry = cache.get(key);
          if (!entry) return null;
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            cache.delete(key);
            return null;
          }
          return entry.value as T;
        },
        set: async <T>(key: string, value: T, ttlSeconds?: number): Promise<void> => {
          cache.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
          });
        },
        delete: async (key: string): Promise<void> => {
          cache.delete(key);
        },
        clear: async (): Promise<void> => {
          cache.clear();
        },
      } as ICacheService;
    });
  }

  /**
   * Get a service by key
   */
  static async get<T>(key: ServiceKey): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }
    return container.resolve<T>(key);
  }

  /**
   * Get a synchronously initialized service
   */
  static getSync<T>(key: ServiceKey): T {
    return container.resolveSync<T>(key);
  }

  /**
   * Register a mock service (for testing)
   */
  static registerMock<T>(key: ServiceKey, mock: T): void {
    container.registerInstance(key, mock);
  }

  /**
   * Reset all services (for testing)
   */
  static reset(): void {
    container.clear();
    this.initialized = false;
  }

  /**
   * Reset singleton instances (for testing)
   */
  static resetInstances(): void {
    container.resetInstances();
  }
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Get the AI orchestrator service
 */
export async function getAIOrchestrator(): Promise<IAIOrchestrator> {
  return ServiceFactory.get<IAIOrchestrator>(ServiceKeys.AI_ORCHESTRATOR);
}

/**
 * Get the API logger
 */
export async function getApiLogger(): Promise<ILogger> {
  return ServiceFactory.get<ILogger>(ServiceKeys.LOGGER_API);
}

/**
 * Get the AI logger
 */
export async function getAiLogger(): Promise<ILogger> {
  return ServiceFactory.get<ILogger>(ServiceKeys.LOGGER_AI);
}

/**
 * Get the feature flags service
 */
export async function getFeatureFlags(): Promise<IFeatureFlags> {
  return ServiceFactory.get<IFeatureFlags>(ServiceKeys.FEATURE_FLAGS);
}

/**
 * Get the cache service
 */
export async function getCacheService(): Promise<ICacheService> {
  return ServiceFactory.get<ICacheService>(ServiceKeys.CACHE);
}

/**
 * Get the database service
 */
export async function getDatabaseService(): Promise<IDatabaseService> {
  return ServiceFactory.get<IDatabaseService>(ServiceKeys.DATABASE);
}

// ================================================================
// EXPORTS
// ================================================================

export {
  ServiceContainer,
};

export default {
  ServiceFactory,
  ServiceKeys,
  container,
  getAIOrchestrator,
  getApiLogger,
  getAiLogger,
  getFeatureFlags,
  getCacheService,
  getDatabaseService,
};
