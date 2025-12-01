/**
 * Graceful Shutdown Tests
 *
 * Phase 3, Week 10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ShutdownManager,
  HealthCheckManager,
  ConnectionDrainer,
  WebSocketDrainer,
  KeepAliveMonitor,
  setupGracefulShutdown,
  createMemoryCheck,
  createEventLoopCheck,
} from './index';

// ================================================================
// SHUTDOWN MANAGER TESTS
// ================================================================

describe('Graceful Shutdown: ShutdownManager', () => {
  let manager: ShutdownManager;

  beforeEach(() => {
    manager = new ShutdownManager({
      exitProcess: false,
      timeout: 5000,
    });
  });

  describe('register', () => {
    it('should register handlers', () => {
      manager.register({
        name: 'test-handler',
        handler: async () => {},
      });

      expect(manager.getHandlerNames()).toContain('test-handler');
      expect(manager.handlerCount).toBe(1);
    });

    it('should register multiple handlers', () => {
      manager.register({ name: 'handler1', handler: async () => {} });
      manager.register({ name: 'handler2', handler: async () => {} });
      manager.register({ name: 'handler3', handler: async () => {} });

      expect(manager.handlerCount).toBe(3);
    });
  });

  describe('unregister', () => {
    it('should unregister handlers', () => {
      manager.register({ name: 'test', handler: async () => {} });
      expect(manager.handlerCount).toBe(1);

      manager.unregister('test');
      expect(manager.handlerCount).toBe(0);
    });
  });

  describe('initiateShutdown', () => {
    it('should execute handlers on shutdown', async () => {
      const executed: string[] = [];

      manager.register({
        name: 'handler1',
        handler: async () => {
          executed.push('handler1');
        },
      });

      manager.register({
        name: 'handler2',
        handler: async () => {
          executed.push('handler2');
        },
      });

      const result = await manager.initiateShutdown('test');

      expect(result.success).toBe(true);
      expect(executed).toContain('handler1');
      expect(executed).toContain('handler2');
    });

    it('should respect priority order', async () => {
      const order: string[] = [];

      manager.register({
        name: 'low',
        handler: async () => order.push('low'),
        priority: 'low',
      });

      manager.register({
        name: 'critical',
        handler: async () => order.push('critical'),
        priority: 'critical',
      });

      manager.register({
        name: 'high',
        handler: async () => order.push('high'),
        priority: 'high',
      });

      await manager.initiateShutdown('test');

      expect(order).toEqual(['critical', 'high', 'low']);
    });

    it('should handle handler failures', async () => {
      manager.register({
        name: 'failing',
        handler: async () => {
          throw new Error('Test error');
        },
      });

      manager.register({
        name: 'succeeding',
        handler: async () => {},
      });

      const result = await manager.initiateShutdown('test');

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.handlers.length).toBe(2);
    });

    it('should timeout slow handlers', async () => {
      manager = new ShutdownManager({
        exitProcess: false,
        timeout: 100,
      });

      manager.register({
        name: 'slow',
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
        timeout: 50,
      });

      const result = await manager.initiateShutdown('test');

      expect(result.handlers[0].timedOut).toBe(true);
    });

    it('should only shutdown once', async () => {
      let count = 0;

      manager.register({
        name: 'counter',
        handler: async () => {
          count++;
        },
      });

      const [result1, result2] = await Promise.all([
        manager.initiateShutdown('test1'),
        manager.initiateShutdown('test2'),
      ]);

      expect(count).toBe(1);
      expect(result1).toBe(result2);
    });
  });

  describe('getPhase', () => {
    it('should track shutdown phase', async () => {
      expect(manager.getPhase()).toBe('running');

      const shutdownPromise = manager.initiateShutdown('test');

      // Phase should change during shutdown
      await shutdownPromise;

      expect(manager.getPhase()).toBe('closed');
    });
  });

  describe('isShuttingDown', () => {
    it('should return false initially', () => {
      expect(manager.isShuttingDown()).toBe(false);
    });

    it('should return true during shutdown', async () => {
      manager.register({
        name: 'check',
        handler: async () => {
          expect(manager.isShuttingDown()).toBe(true);
        },
      });

      await manager.initiateShutdown('test');
    });
  });
});

// ================================================================
// HEALTH CHECK TESTS
// ================================================================

describe('Graceful Shutdown: HealthCheckManager', () => {
  let health: HealthCheckManager;

  beforeEach(() => {
    health = new HealthCheckManager();
  });

  describe('register', () => {
    it('should register health checks', () => {
      health.register({
        name: 'test',
        check: () => true,
      });

      expect(health.getCheckNames()).toContain('test');
    });
  });

  describe('check', () => {
    it('should return healthy when all checks pass', async () => {
      health.register({ name: 'check1', check: () => true });
      health.register({ name: 'check2', check: () => true });

      const result = await health.check();

      expect(result.status).toBe('healthy');
      expect(result.ready).toBe(true);
      expect(result.live).toBe(true);
    });

    it('should return unhealthy when critical check fails', async () => {
      health.register({ name: 'critical', check: () => false, critical: true });
      health.register({ name: 'normal', check: () => true });

      const result = await health.check();

      expect(result.status).toBe('unhealthy');
      expect(result.ready).toBe(false);
    });

    it('should return degraded when non-critical check fails', async () => {
      health.register({ name: 'critical', check: () => true, critical: true });
      health.register({ name: 'normal', check: () => false, critical: false });

      const result = await health.check();

      expect(result.status).toBe('degraded');
      expect(result.ready).toBe(true);
    });

    it('should handle async checks', async () => {
      health.register({
        name: 'async',
        check: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return true;
        },
      });

      const result = await health.check();

      expect(result.status).toBe('healthy');
      expect(result.checks[0].duration).toBeGreaterThan(0);
    });

    it('should handle check errors', async () => {
      health.register({
        name: 'error',
        check: () => {
          throw new Error('Check failed');
        },
        critical: true,
      });

      const result = await health.check();

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].error).toBe('Check failed');
    });

    it('should timeout slow checks', async () => {
      health.register({
        name: 'slow',
        check: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        },
        timeout: 50,
        critical: true,
      });

      const result = await health.check();

      expect(result.status).toBe('unhealthy');
      expect(result.checks[0].error).toContain('timeout');
    });
  });

  describe('isReady', () => {
    it('should return true when healthy', async () => {
      health.register({ name: 'test', check: () => true, critical: true });

      const ready = await health.isReady();
      expect(ready).toBe(true);
    });

    it('should return false when unhealthy', async () => {
      health.register({ name: 'test', check: () => false, critical: true });

      const ready = await health.isReady();
      expect(ready).toBe(false);
    });

    it('should return false when shutting down', async () => {
      health.register({ name: 'test', check: () => true });
      health.setShuttingDown();

      const ready = await health.isReady();
      expect(ready).toBe(false);
    });
  });

  describe('isLive', () => {
    it('should return true normally', () => {
      expect(health.isLive()).toBe(true);
    });

    it('should return false when shutting down', () => {
      health.setShuttingDown();
      expect(health.isLive()).toBe(false);
    });
  });

  describe('setShuttingDown', () => {
    it('should update status', () => {
      health.setShuttingDown();
      expect(health.getStatus()).toBe('shutting_down');
    });
  });
});

// ================================================================
// COMMON HEALTH CHECKS TESTS
// ================================================================

describe('Graceful Shutdown: Common Health Checks', () => {
  describe('createMemoryCheck', () => {
    it('should pass when memory is under threshold', async () => {
      const check = createMemoryCheck(2048); // 2GB threshold

      const result = await check.check();
      expect(result).toBe(true);
    });

    it('should fail when memory exceeds threshold', async () => {
      const check = createMemoryCheck(0.001); // Very low threshold

      const result = await check.check();
      expect(result).toBe(false);
    });
  });

  describe('createEventLoopCheck', () => {
    it('should pass when event loop is responsive', async () => {
      const check = createEventLoopCheck(1000); // 1 second threshold

      const result = await check.check();
      expect(result).toBe(true);
    });
  });
});

// ================================================================
// CONNECTION DRAINER TESTS
// ================================================================

describe('Graceful Shutdown: ConnectionDrainer', () => {
  let drainer: ConnectionDrainer<{ id: number }>;

  beforeEach(() => {
    drainer = new ConnectionDrainer({
      drainTimeout: 1000,
      checkInterval: 10,
    });
  });

  describe('add/remove', () => {
    it('should track connections', () => {
      const conn1 = { id: 1 };
      const conn2 = { id: 2 };

      drainer.add(conn1);
      drainer.add(conn2);

      expect(drainer.count).toBe(2);

      drainer.remove(conn1);
      expect(drainer.count).toBe(1);
    });
  });

  describe('drain', () => {
    it('should wait for connections to close', async () => {
      const conn = { id: 1 };
      drainer.add(conn);

      // Remove after 50ms
      setTimeout(() => drainer.remove(conn), 50);

      const remaining = await drainer.drain();
      expect(remaining).toBe(0);
    });

    it('should timeout if connections dont close', async () => {
      drainer = new ConnectionDrainer({
        drainTimeout: 100,
        checkInterval: 10,
      });

      drainer.add({ id: 1 });

      const remaining = await drainer.drain();
      expect(remaining).toBe(1);
    });

    it('should throw if already draining', async () => {
      const drainPromise = drainer.drain();

      await expect(drainer.drain()).rejects.toThrow('Already draining');

      await drainPromise;
    });
  });

  describe('forceClose', () => {
    it('should force close all connections', async () => {
      const closed: number[] = [];

      drainer.add({ id: 1 });
      drainer.add({ id: 2 });
      drainer.add({ id: 3 });

      await drainer.forceClose(async (conn) => {
        closed.push(conn.id);
      });

      expect(closed).toEqual([1, 2, 3]);
      expect(drainer.count).toBe(0);
    });
  });

  describe('getConnections', () => {
    it('should return all connections', () => {
      drainer.add({ id: 1 });
      drainer.add({ id: 2 });

      const conns = drainer.getConnections();
      expect(conns.length).toBe(2);
    });
  });
});

// ================================================================
// WEBSOCKET DRAINER TESTS
// ================================================================

describe('Graceful Shutdown: WebSocketDrainer', () => {
  interface MockWebSocket {
    close: (code?: number, reason?: string) => void;
    closed: boolean;
    closeCode?: number;
    closeReason?: string;
  }

  let drainer: WebSocketDrainer<MockWebSocket>;

  const createMockWs = (): MockWebSocket => ({
    close: function (code, reason) {
      this.closed = true;
      this.closeCode = code;
      this.closeReason = reason;
    },
    closed: false,
  });

  beforeEach(() => {
    drainer = new WebSocketDrainer({
      drainTimeout: 1000,
      checkInterval: 10,
    });
  });

  describe('broadcastClose', () => {
    it('should close all connections', () => {
      const ws1 = createMockWs();
      const ws2 = createMockWs();

      drainer.add(ws1);
      drainer.add(ws2);

      drainer.broadcastClose('Shutdown', 1001);

      expect(ws1.closed).toBe(true);
      expect(ws1.closeCode).toBe(1001);
      expect(ws1.closeReason).toBe('Shutdown');
      expect(ws2.closed).toBe(true);
    });
  });

  describe('forceClose', () => {
    it('should broadcast close and clear', () => {
      const ws = createMockWs();
      drainer.add(ws);

      drainer.forceClose();

      expect(ws.closed).toBe(true);
      expect(drainer.count).toBe(0);
    });
  });
});

// ================================================================
// KEEP-ALIVE MONITOR TESTS
// ================================================================

describe('Graceful Shutdown: KeepAliveMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('heartbeat', () => {
    it('should reset missed count', () => {
      const monitor = new KeepAliveMonitor({
        interval: 100,
        maxMissed: 3,
      });

      monitor.start();

      // Miss some heartbeats
      vi.advanceTimersByTime(300);
      expect(monitor.getMissedCount()).toBeGreaterThan(0);

      // Record heartbeat
      monitor.heartbeat();
      expect(monitor.getMissedCount()).toBe(0);

      monitor.stop();
    });
  });

  describe('isHealthy', () => {
    it('should return true when under threshold', () => {
      const monitor = new KeepAliveMonitor({
        interval: 100,
        maxMissed: 5,
      });

      monitor.start();
      vi.advanceTimersByTime(200);

      expect(monitor.isHealthy()).toBe(true);

      monitor.stop();
    });

    it('should return false when over threshold', () => {
      const monitor = new KeepAliveMonitor({
        interval: 100,
        maxMissed: 2,
      });

      monitor.start();
      vi.advanceTimersByTime(400);

      expect(monitor.isHealthy()).toBe(false);

      monitor.stop();
    });
  });

  describe('callbacks', () => {
    it('should call onHeartbeat', () => {
      const onHeartbeat = vi.fn();
      const monitor = new KeepAliveMonitor({
        interval: 100,
        onHeartbeat,
      });

      monitor.heartbeat();

      expect(onHeartbeat).toHaveBeenCalled();
    });

    it('should call onMissedHeartbeat', () => {
      const onMissedHeartbeat = vi.fn();
      const monitor = new KeepAliveMonitor({
        interval: 100,
        onMissedHeartbeat,
      });

      monitor.start();
      vi.advanceTimersByTime(200);

      expect(onMissedHeartbeat).toHaveBeenCalled();

      monitor.stop();
    });
  });
});

// ================================================================
// SETUP FUNCTION TESTS
// ================================================================

describe('Graceful Shutdown: setupGracefulShutdown', () => {
  it('should create manager and health instances', () => {
    const { shutdown, health } = setupGracefulShutdown({
      exitProcess: false,
      healthChecks: true,
    });

    expect(shutdown).toBeInstanceOf(ShutdownManager);
    expect(health).toBeInstanceOf(HealthCheckManager);
  });

  it('should register default health checks', () => {
    const { health } = setupGracefulShutdown({
      exitProcess: false,
      healthChecks: true,
    });

    const checkNames = health.getCheckNames();
    expect(checkNames).toContain('memory');
    expect(checkNames).toContain('event-loop');
  });

  it('should connect health to shutdown', async () => {
    const { shutdown, health } = setupGracefulShutdown({
      exitProcess: false,
    });

    expect(health.isLive()).toBe(true);

    await shutdown.initiateShutdown('test');

    expect(health.isLive()).toBe(false);
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Graceful Shutdown: Integration', () => {
  it('should handle complete shutdown flow', async () => {
    const events: string[] = [];

    const { shutdown, health } = setupGracefulShutdown({
      exitProcess: false,
      timeout: 5000,
    });

    const drainer = new ConnectionDrainer({ drainTimeout: 1000 });

    // Simulate connection
    const conn = { id: 1 };
    drainer.add(conn);

    // Register handlers
    shutdown.register({
      name: 'health',
      handler: () => {
        health.setShuttingDown();
        events.push('health-shutdown');
      },
      priority: 'critical',
    });

    shutdown.register({
      name: 'drain',
      handler: async () => {
        events.push('drain-start');
        // Simulate connection closing
        drainer.remove(conn);
        await drainer.drain();
        events.push('drain-complete');
      },
      priority: 'high',
    });

    shutdown.register({
      name: 'cleanup',
      handler: () => {
        events.push('cleanup');
      },
      priority: 'low',
    });

    // Initiate shutdown
    const result = await shutdown.initiateShutdown('test');

    expect(result.success).toBe(true);
    expect(events).toEqual([
      'health-shutdown',
      'drain-start',
      'drain-complete',
      'cleanup',
    ]);
    expect(health.isLive()).toBe(false);
  });
});
