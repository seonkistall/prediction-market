import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // HTTP metrics
  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;
  readonly httpRequestsInProgress: Gauge;

  // Business metrics
  readonly betsPlacedTotal: Counter;
  readonly betsAmountTotal: Counter;
  readonly roundsCreatedTotal: Counter;
  readonly roundsSettledTotal: Counter;
  readonly activeUsersGauge: Gauge;
  readonly websocketConnectionsGauge: Gauge;

  constructor() {
    this.registry = new Registry();

    // HTTP Request Counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    // HTTP Requests In Progress
    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method'],
      registers: [this.registry],
    });

    // Bets Counter
    this.betsPlacedTotal = new Counter({
      name: 'bets_placed_total',
      help: 'Total number of bets placed',
      labelNames: ['market', 'position'],
      registers: [this.registry],
    });

    // Bets Amount Counter
    this.betsAmountTotal = new Counter({
      name: 'bets_amount_total',
      help: 'Total amount of bets placed',
      labelNames: ['market'],
      registers: [this.registry],
    });

    // Rounds Created
    this.roundsCreatedTotal = new Counter({
      name: 'rounds_created_total',
      help: 'Total number of rounds created',
      labelNames: ['market'],
      registers: [this.registry],
    });

    // Rounds Settled
    this.roundsSettledTotal = new Counter({
      name: 'rounds_settled_total',
      help: 'Total number of rounds settled',
      labelNames: ['market', 'outcome'],
      registers: [this.registry],
    });

    // Active Users Gauge
    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of active users',
      registers: [this.registry],
    });

    // WebSocket Connections Gauge
    this.websocketConnectionsGauge = new Gauge({
      name: 'websocket_connections',
      help: 'Number of active WebSocket connections',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // Collect default Node.js metrics
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  // Helper methods for recording metrics
  recordHttpRequest(method: string, path: string, status: number, duration: number): void {
    const normalizedPath = this.normalizePath(path);
    this.httpRequestsTotal.inc({ method, path: normalizedPath, status: String(status) });
    this.httpRequestDuration.observe(
      { method, path: normalizedPath, status: String(status) },
      duration,
    );
  }

  recordBetPlaced(market: string, position: 'up' | 'down', amount: number): void {
    this.betsPlacedTotal.inc({ market, position });
    this.betsAmountTotal.inc({ market }, amount);
  }

  recordRoundCreated(market: string): void {
    this.roundsCreatedTotal.inc({ market });
  }

  recordRoundSettled(market: string, outcome: string): void {
    this.roundsSettledTotal.inc({ market, outcome });
  }

  setActiveUsers(count: number): void {
    this.activeUsersGauge.set(count);
  }

  setWebSocketConnections(count: number): void {
    this.websocketConnectionsGauge.set(count);
  }

  private normalizePath(path: string): string {
    // Normalize paths with UUIDs or IDs
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }
}
