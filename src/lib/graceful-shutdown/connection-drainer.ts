/**
 * Connection Drainer
 *
 * Gracefully drain connections before shutdown
 *
 * Phase 3, Week 10
 */

import type { ConnectionDrainerOptions } from './types';

// ================================================================
// DEFAULT OPTIONS
// ================================================================

const DEFAULT_OPTIONS: Required<ConnectionDrainerOptions> = {
  drainTimeout: 30000,
  checkInterval: 100,
  onDrainStart: () => {},
  onDrainComplete: () => {},
};

// ================================================================
// CONNECTION DRAINER
// ================================================================

/**
 * Connection Drainer
 *
 * Track and drain active connections before shutdown
 *
 * @example
 * ```typescript
 * const drainer = new ConnectionDrainer();
 *
 * // Track connections
 * server.on('connection', (socket) => {
 *   drainer.add(socket);
 *   socket.on('close', () => drainer.remove(socket));
 * });
 *
 * // During shutdown
 * shutdown.register({
 *   name: 'drain-connections',
 *   handler: async () => {
 *     await drainer.drain();
 *   },
 * });
 * ```
 */
export class ConnectionDrainer<T = unknown> {
  private readonly options: Required<ConnectionDrainerOptions>;
  private readonly connections: Set<T> = new Set();
  private isDraining = false;

  constructor(options: ConnectionDrainerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Add a connection to track
   */
  add(connection: T): void {
    this.connections.add(connection);
  }

  /**
   * Remove a connection
   */
  remove(connection: T): boolean {
    return this.connections.delete(connection);
  }

  /**
   * Get current connection count
   */
  get count(): number {
    return this.connections.size;
  }

  /**
   * Check if draining
   */
  get draining(): boolean {
    return this.isDraining;
  }

  /**
   * Get all connections
   */
  getConnections(): T[] {
    return [...this.connections];
  }

  /**
   * Wait for all connections to close
   */
  async drain(): Promise<number> {
    if (this.isDraining) {
      throw new Error('Already draining');
    }

    this.isDraining = true;
    this.options.onDrainStart();

    const startTime = Date.now();
    const timeout = this.options.drainTimeout;

    // Wait for connections to close
    while (this.connections.size > 0) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        break;
      }

      // Wait before checking again
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.checkInterval)
      );
    }

    const remaining = this.connections.size;
    this.options.onDrainComplete(remaining);

    return remaining;
  }

  /**
   * Force close all connections with cleanup function
   */
  async forceClose(closeFn: (connection: T) => Promise<void> | void): Promise<void> {
    const closePromises = [...this.connections].map(async (conn) => {
      try {
        await closeFn(conn);
        this.connections.delete(conn);
      } catch {
        // Ignore errors during force close
      }
    });

    await Promise.all(closePromises);
  }

  /**
   * Clear all tracked connections (without closing)
   */
  clear(): void {
    this.connections.clear();
  }
}

// ================================================================
// HTTP CONNECTION DRAINER
// ================================================================

import type { Server, IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';

interface TrackedSocket extends Socket {
  _httpDrainer?: {
    requests: number;
    idle: boolean;
  };
}

/**
 * HTTP Server Connection Drainer
 *
 * @example
 * ```typescript
 * const server = http.createServer(app);
 * const drainer = new HttpConnectionDrainer(server);
 *
 * // During shutdown
 * shutdown.register({
 *   name: 'http-server',
 *   handler: async () => {
 *     await drainer.drain();
 *   },
 *   priority: 'critical',
 * });
 * ```
 */
export class HttpConnectionDrainer {
  private readonly server: Server;
  private readonly sockets: Set<TrackedSocket> = new Set();
  private readonly options: Required<ConnectionDrainerOptions>;
  private isDraining = false;
  private isAccepting = true;

  constructor(server: Server, options: ConnectionDrainerOptions = {}) {
    this.server = server;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Track connections
    server.on('connection', this.onConnection.bind(this));
    server.on('request', this.onRequest.bind(this));
  }

  /**
   * Handle new connection
   */
  private onConnection(socket: TrackedSocket): void {
    if (!this.isAccepting) {
      socket.destroy();
      return;
    }

    socket._httpDrainer = { requests: 0, idle: true };
    this.sockets.add(socket);

    socket.on('close', () => {
      this.sockets.delete(socket);
    });
  }

  /**
   * Handle new request
   */
  private onRequest(req: IncomingMessage, res: ServerResponse): void {
    const socket = req.socket as TrackedSocket;

    if (socket._httpDrainer) {
      socket._httpDrainer.requests++;
      socket._httpDrainer.idle = false;
    }

    res.on('finish', () => {
      if (socket._httpDrainer) {
        socket._httpDrainer.requests--;
        socket._httpDrainer.idle = socket._httpDrainer.requests === 0;

        // Close idle connections during drain
        if (this.isDraining && socket._httpDrainer.idle) {
          socket.destroy();
        }
      }
    });
  }

  /**
   * Get active connection count
   */
  get count(): number {
    return this.sockets.size;
  }

  /**
   * Get active request count
   */
  get activeRequests(): number {
    let count = 0;
    for (const socket of this.sockets) {
      count += socket._httpDrainer?.requests || 0;
    }
    return count;
  }

  /**
   * Stop accepting new connections
   */
  stopAccepting(): void {
    this.isAccepting = false;
  }

  /**
   * Drain connections gracefully
   */
  async drain(): Promise<number> {
    if (this.isDraining) {
      throw new Error('Already draining');
    }

    this.isDraining = true;
    this.stopAccepting();
    this.options.onDrainStart();

    // Close idle connections immediately
    this.closeIdleConnections();

    const startTime = Date.now();
    const timeout = this.options.drainTimeout;

    // Wait for active connections
    while (this.sockets.size > 0) {
      if (Date.now() - startTime > timeout) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, this.options.checkInterval)
      );

      // Keep closing idle connections
      this.closeIdleConnections();
    }

    // Close the server
    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err && err.message !== 'Server is not running') {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    const remaining = this.sockets.size;
    this.options.onDrainComplete(remaining);

    return remaining;
  }

  /**
   * Close idle connections
   */
  private closeIdleConnections(): void {
    for (const socket of this.sockets) {
      if (socket._httpDrainer?.idle) {
        socket.destroy();
      }
    }
  }

  /**
   * Force close all connections
   */
  forceClose(): void {
    for (const socket of this.sockets) {
      socket.destroy();
    }
  }
}

// ================================================================
// WEBSOCKET DRAINER
// ================================================================

/**
 * WebSocket Connection Drainer
 *
 * @example
 * ```typescript
 * const wsDrainer = new WebSocketDrainer();
 *
 * wss.on('connection', (ws) => {
 *   wsDrainer.add(ws);
 *   ws.on('close', () => wsDrainer.remove(ws));
 * });
 *
 * // During shutdown
 * shutdown.register({
 *   name: 'websocket',
 *   handler: async () => {
 *     wsDrainer.broadcastClose('Server shutting down');
 *     await wsDrainer.drain();
 *   },
 * });
 * ```
 */
export class WebSocketDrainer<T extends { close: (code?: number, reason?: string) => void }> {
  private readonly drainer: ConnectionDrainer<T>;
  private readonly options: Required<ConnectionDrainerOptions>;

  constructor(options: ConnectionDrainerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.drainer = new ConnectionDrainer(options);
  }

  /**
   * Add a WebSocket connection
   */
  add(ws: T): void {
    this.drainer.add(ws);
  }

  /**
   * Remove a WebSocket connection
   */
  remove(ws: T): boolean {
    return this.drainer.remove(ws);
  }

  /**
   * Get connection count
   */
  get count(): number {
    return this.drainer.count;
  }

  /**
   * Broadcast close to all connections
   */
  broadcastClose(reason: string = 'Server shutdown', code: number = 1001): void {
    for (const ws of this.drainer.getConnections()) {
      try {
        ws.close(code, reason);
      } catch {
        // Ignore close errors
      }
    }
  }

  /**
   * Drain connections
   */
  async drain(): Promise<number> {
    return this.drainer.drain();
  }

  /**
   * Force close all connections
   */
  forceClose(): void {
    this.broadcastClose('Server force shutdown', 1001);
    this.drainer.clear();
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ConnectionDrainer,
  HttpConnectionDrainer,
  WebSocketDrainer,
};
