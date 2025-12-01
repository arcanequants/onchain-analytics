/**
 * Performance Module Tests
 *
 * Phase 3, Week 9, Day 1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MetricsCollector,
  createMetricsCollector,
  getMetricsCollector,
} from './metrics-collector';
import {
  HealthCheckManager,
  createHealthCheckManager,
  getHealthCheckManager,
  createDatabaseCheck,
  createCacheCheck,
  createExternalServiceCheck,
  createMemoryCheck,
} from './health-check';
import { DEFAULT_PERFORMANCE_CONFIG } from './types';

// ================================================================
// METRICS COLLECTOR
// ================================================================

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = createMetricsCollector();
  });

  describe('request metrics', () => {
    it('should record successful request', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/users',
        statusCode: 200,
        duration: 50,
      });

      const summary = collector.getSummary();
      expect(summary.requests.total).toBe(1);
      expect(summary.requests.successRate).toBe(100);
    });

    it('should track client errors', () => {
      collector.recordRequest({
        method: 'POST',
        endpoint: '/api/users',
        statusCode: 400,
        duration: 10,
      });

      const summary = collector.getSummary();
      expect(summary.requests.total).toBe(1);
      expect(summary.requests.successRate).toBe(0);
    });

    it('should track server errors', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/data',
        statusCode: 500,
        duration: 100,
      });

      const summary = collector.getSummary();
      expect(summary.requests.total).toBe(1);
    });

    it('should calculate response time percentiles', () => {
      // Add 100 requests with different response times
      for (let i = 1; i <= 100; i++) {
        collector.recordRequest({
          method: 'GET',
          endpoint: '/api/test',
          statusCode: 200,
          duration: i * 10, // 10ms to 1000ms
        });
      }

      const summary = collector.getSummary();
      expect(summary.requests.p50).toBeGreaterThan(0);
      expect(summary.requests.p95).toBeGreaterThan(summary.requests.p50);
      expect(summary.requests.p99).toBeGreaterThan(summary.requests.p95);
    });

    it('should normalize endpoints with IDs', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/users/123/profile',
        statusCode: 200,
        duration: 50,
      });

      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/users/456/profile',
        statusCode: 200,
        duration: 50,
      });

      // Both should be counted as same endpoint
      const snapshot = collector.takeSnapshot();
      expect(snapshot.requests.byEndpoint['/api/users/:id/profile']).toBe(2);
    });
  });

  describe('database metrics', () => {
    it('should record query', () => {
      collector.recordQuery({
        operation: 'select',
        duration: 50,
        success: true,
      });

      const summary = collector.getSummary();
      expect(summary.database.totalQueries).toBe(1);
    });

    it('should track slow queries', () => {
      // Default threshold is 100ms
      collector.recordQuery({
        operation: 'select',
        duration: 150,
        success: true,
      });

      const summary = collector.getSummary();
      expect(summary.database.slowQueryRate).toBeGreaterThan(0);
    });

    it('should track query errors', () => {
      collector.recordQuery({
        operation: 'insert',
        duration: 50,
        success: false,
      });

      const summary = collector.getSummary();
      expect(summary.database.errorRate).toBeGreaterThan(0);
    });

    it('should update pool stats', () => {
      collector.updatePoolStats({
        active: 5,
        idle: 10,
        waiting: 2,
      });

      const snapshot = collector.takeSnapshot();
      expect(snapshot.database.pool.active).toBe(5);
      expect(snapshot.database.pool.idle).toBe(10);
      expect(snapshot.database.pool.waiting).toBe(2);
      expect(snapshot.database.pool.size).toBe(15);
    });
  });

  describe('cache metrics', () => {
    it('should record cache hit', () => {
      collector.recordCacheHit();
      collector.recordCacheHit();
      collector.recordCacheMiss();

      const summary = collector.getSummary();
      expect(summary.cache.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should record cache eviction', () => {
      collector.recordCacheEviction();
      collector.recordCacheEviction();

      const snapshot = collector.takeSnapshot();
      expect(snapshot.cache.evictions).toBe(2);
    });

    it('should update cache stats', () => {
      collector.updateCacheStats({
        size: 100,
        memoryUsage: 1024 * 1024,
      });

      const snapshot = collector.takeSnapshot();
      expect(snapshot.cache.size).toBe(100);
      expect(snapshot.cache.memoryUsage).toBe(1024 * 1024);
    });
  });

  describe('AI metrics', () => {
    it('should record AI call', () => {
      collector.recordAICall({
        provider: 'openai',
        success: true,
        latency: 500,
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      });

      const summary = collector.getSummary();
      expect(summary.ai.totalCalls).toBe(1);
      expect(summary.ai.successRate).toBe(100);
    });

    it('should track by provider', () => {
      collector.recordAICall({
        provider: 'openai',
        success: true,
        latency: 500,
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      });

      collector.recordAICall({
        provider: 'anthropic',
        success: true,
        latency: 300,
        inputTokens: 80,
        outputTokens: 40,
        cost: 0.0008,
      });

      const snapshot = collector.takeSnapshot();
      expect(snapshot.ai.byProvider['openai']).toBe(1);
      expect(snapshot.ai.byProvider['anthropic']).toBe(1);
    });

    it('should calculate cost per call', () => {
      collector.recordAICall({
        provider: 'openai',
        success: true,
        latency: 500,
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.002,
      });

      collector.recordAICall({
        provider: 'openai',
        success: true,
        latency: 500,
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.004,
      });

      const summary = collector.getSummary();
      expect(summary.ai.costPerCall).toBeCloseTo(0.003, 4);
    });
  });

  describe('job metrics', () => {
    it('should record job completion', () => {
      collector.recordJobComplete({
        type: 'analyze:brand',
        duration: 5000,
        success: true,
      });

      const summary = collector.getSummary();
      expect(summary.jobs.totalProcessed).toBe(1);
      expect(summary.jobs.successRate).toBe(100);
    });

    it('should track failed jobs', () => {
      collector.recordJobComplete({
        type: 'analyze:brand',
        duration: 1000,
        success: false,
      });

      const summary = collector.getSummary();
      expect(summary.jobs.successRate).toBe(0);
    });

    it('should record retries', () => {
      collector.recordJobRetry();
      collector.recordJobRetry();

      const snapshot = collector.takeSnapshot();
      expect(snapshot.jobs.retried).toBe(2);
    });

    it('should update queue stats', () => {
      collector.updateQueueStats({
        queueSize: 10,
        activeJobs: 3,
      });

      const summary = collector.getSummary();
      expect(summary.jobs.queueDepth).toBe(10);
    });
  });

  describe('snapshots', () => {
    it('should take snapshot', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/test',
        statusCode: 200,
        duration: 50,
      });

      const snapshot = collector.takeSnapshot();

      expect(snapshot.requests.total).toBe(1);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });

    it('should store snapshots history', () => {
      collector.takeSnapshot();
      collector.takeSnapshot();
      collector.takeSnapshot();

      const snapshots = collector.getSnapshots(10);
      expect(snapshots.length).toBe(3);
    });

    it('should limit history size', () => {
      const smallCollector = createMetricsCollector({ maxHistorySize: 5 });

      for (let i = 0; i < 10; i++) {
        smallCollector.takeSnapshot();
      }

      const snapshots = smallCollector.getSnapshots(100);
      expect(snapshots.length).toBe(5);
    });
  });

  describe('prometheus export', () => {
    it('should export to prometheus format', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/test',
        statusCode: 200,
        duration: 50,
      });

      const metrics = collector.toPrometheus();

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some(m => m.name === 'http_requests_total')).toBe(true);
    });

    it('should export prometheus text format', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/test',
        statusCode: 200,
        duration: 50,
      });

      const text = collector.toPrometheusText();

      expect(text).toContain('# HELP http_requests_total');
      expect(text).toContain('# TYPE http_requests_total counter');
    });
  });

  describe('lifecycle', () => {
    it('should reset all metrics', () => {
      collector.recordRequest({
        method: 'GET',
        endpoint: '/api/test',
        statusCode: 200,
        duration: 50,
      });

      collector.reset();

      const summary = collector.getSummary();
      expect(summary.requests.total).toBe(0);
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getMetricsCollector();
      const instance2 = getMetricsCollector();

      expect(instance1).toBe(instance2);
    });
  });
});

// ================================================================
// HEALTH CHECK MANAGER
// ================================================================

describe('HealthCheckManager', () => {
  let manager: HealthCheckManager;

  beforeEach(() => {
    manager = createHealthCheckManager({
      version: '1.0.0',
      environment: 'test',
    });
  });

  describe('registration', () => {
    it('should register health check', () => {
      manager.register('test', async () => ({
        name: 'test',
        status: 'healthy',
        lastChecked: new Date(),
      }));

      expect(manager.getComponentHealth('test')).toBeNull(); // Not run yet
    });

    it('should unregister health check', () => {
      manager.register('test', async () => ({
        name: 'test',
        status: 'healthy',
        lastChecked: new Date(),
      }));

      const result = manager.unregister('test');
      expect(result).toBe(true);
    });
  });

  describe('health checks', () => {
    it('should run all checks', async () => {
      manager.register('db', async () => ({
        name: 'db',
        status: 'healthy',
        lastChecked: new Date(),
      }));

      manager.register('cache', async () => ({
        name: 'cache',
        status: 'healthy',
        lastChecked: new Date(),
      }));

      const report = await manager.checkAll();

      expect(report.status).toBe('healthy');
      expect(report.components.length).toBe(2);
    });

    it('should detect degraded status', async () => {
      manager.register('db', async () => ({
        name: 'db',
        status: 'healthy',
        lastChecked: new Date(),
      }));

      manager.register('cache', async () => ({
        name: 'cache',
        status: 'degraded',
        message: 'High latency',
        lastChecked: new Date(),
      }));

      const report = await manager.checkAll();

      expect(report.status).toBe('degraded');
    });

    it('should detect unhealthy status', async () => {
      manager.register('db', async () => ({
        name: 'db',
        status: 'unhealthy',
        message: 'Connection failed',
        lastChecked: new Date(),
      }));

      const report = await manager.checkAll();

      expect(report.status).toBe('unhealthy');
    });

    it('should handle check errors', async () => {
      // Create manager with failureThreshold of 1 to immediately mark as unhealthy
      const strictManager = createHealthCheckManager({
        config: { failureThreshold: 1 },
      });

      strictManager.register('failing', async () => {
        throw new Error('Check failed');
      });

      const report = await strictManager.checkAll();

      expect(report.status).toBe('unhealthy');
      expect(report.components[0].message).toContain('Check failed');
    });

    it('should handle timeout', async () => {
      const slowManager = createHealthCheckManager({
        config: { timeout: 100 },
      });

      slowManager.register('slow', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          name: 'slow',
          status: 'healthy',
          lastChecked: new Date(),
        };
      });

      const report = await slowManager.checkAll();

      expect(report.components[0].message).toContain('timeout');
    });

    it('should measure response time', async () => {
      manager.register('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          name: 'test',
          status: 'healthy',
          lastChecked: new Date(),
        };
      });

      const report = await manager.checkAll();

      expect(report.components[0].responseTime).toBeGreaterThan(0);
    });
  });

  describe('report metadata', () => {
    it('should include version', async () => {
      const report = await manager.checkAll();
      expect(report.version).toBe('1.0.0');
    });

    it('should include environment', async () => {
      const report = await manager.checkAll();
      expect(report.environment).toBe('test');
    });

    it('should include uptime', async () => {
      const report = await manager.checkAll();
      expect(report.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getHealthCheckManager();
      const instance2 = getHealthCheckManager();

      expect(instance1).toBe(instance2);
    });
  });
});

// ================================================================
// BUILT-IN HEALTH CHECKS
// ================================================================

describe('Built-in Health Checks', () => {
  describe('createDatabaseCheck', () => {
    it('should return healthy on success', async () => {
      const check = createDatabaseCheck(async () => true);
      const result = await check();

      expect(result.name).toBe('database');
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy on failure', async () => {
      const check = createDatabaseCheck(async () => false);
      const result = await check();

      expect(result.status).toBe('unhealthy');
    });

    it('should handle errors', async () => {
      const check = createDatabaseCheck(async () => {
        throw new Error('Connection refused');
      });
      const result = await check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection refused');
    });
  });

  describe('createCacheCheck', () => {
    it('should return healthy on success', async () => {
      const check = createCacheCheck(async () => true);
      const result = await check();

      expect(result.name).toBe('cache');
      expect(result.status).toBe('healthy');
    });

    it('should return degraded on failure (non-critical)', async () => {
      const check = createCacheCheck(async () => false);
      const result = await check();

      expect(result.status).toBe('degraded');
    });
  });

  describe('createExternalServiceCheck', () => {
    it('should return healthy on success', async () => {
      const check = createExternalServiceCheck('stripe', async () => true);
      const result = await check();

      expect(result.name).toBe('stripe');
      expect(result.status).toBe('healthy');
    });

    it('should return degraded for non-critical service', async () => {
      const check = createExternalServiceCheck('analytics', async () => false);
      const result = await check();

      expect(result.status).toBe('degraded');
    });

    it('should return unhealthy for critical service', async () => {
      const check = createExternalServiceCheck('payment', async () => false, {
        critical: true,
      });
      const result = await check();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('createMemoryCheck', () => {
    it('should return healthy under threshold', async () => {
      const check = createMemoryCheck({ maxHeapPercent: 99 });
      const result = await check();

      expect(result.name).toBe('memory');
      expect(result.status).toBe('healthy');
    });

    it('should include memory details', async () => {
      const check = createMemoryCheck();
      const result = await check();

      expect(result.details).toBeDefined();
      expect(result.details?.heapUsed).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// CONFIGURATION
// ================================================================

describe('Configuration', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_PERFORMANCE_CONFIG.enabled).toBe(true);
    expect(DEFAULT_PERFORMANCE_CONFIG.collectionInterval).toBe(10000);
    expect(DEFAULT_PERFORMANCE_CONFIG.tracingSampleRate).toBeGreaterThan(0);
    expect(DEFAULT_PERFORMANCE_CONFIG.tracingSampleRate).toBeLessThanOrEqual(1);
  });

  it('should allow custom config', () => {
    const collector = createMetricsCollector({
      collectionInterval: 5000,
      slowRequestThreshold: 500,
    });

    // The collector should be created with custom config
    expect(collector).toBeDefined();
  });
});
