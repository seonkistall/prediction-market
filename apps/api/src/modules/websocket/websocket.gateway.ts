import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

interface RoundUpdate {
  roundId: string;
  marketSymbol: string;
  status?: string;
  lockPrice?: string;
  endPrice?: string;
  outcome?: string;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: Date;
}

interface BetPlacedEvent {
  bet: {
    id: string;
    userId: string;
    position: string;
    amount: string;
  };
  round: {
    id: string;
    totalUpPool: string;
    totalDownPool: string;
    upCount: number;
    downCount: number;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || '*',
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
})
export class PredictionWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PredictionWebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Set<string>>(); // socketId -> subscribed markets

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, new Set());
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:market')
  handleSubscribeMarket(client: Socket, payload: { symbol: string }) {
    const room = `market:${payload.symbol}`;
    client.join(room);

    const subscriptions = this.connectedClients.get(client.id);
    if (subscriptions) {
      subscriptions.add(payload.symbol);
    }

    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { market: payload.symbol } };
  }

  @SubscribeMessage('unsubscribe:market')
  handleUnsubscribeMarket(client: Socket, payload: { symbol: string }) {
    const room = `market:${payload.symbol}`;
    client.leave(room);

    const subscriptions = this.connectedClients.get(client.id);
    if (subscriptions) {
      subscriptions.delete(payload.symbol);
    }

    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { event: 'unsubscribed', data: { market: payload.symbol } };
  }

  @SubscribeMessage('subscribe:round')
  handleSubscribeRound(client: Socket, payload: { roundId: string }) {
    const room = `round:${payload.roundId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { round: payload.roundId } };
  }

  // Event handlers for internal events
  @OnEvent('round.created')
  handleRoundCreated(data: RoundUpdate) {
    const room = `market:${data.marketSymbol}`;
    this.server.to(room).emit('round:created', data);
    this.logger.debug(`Emitted round:created to ${room}`);
  }

  @OnEvent('round.locked')
  handleRoundLocked(data: RoundUpdate) {
    const room = `market:${data.marketSymbol}`;
    this.server.to(room).emit('round:locked', data);
    this.server.to(`round:${data.roundId}`).emit('round:locked', data);
    this.logger.debug(`Emitted round:locked to ${room}`);
  }

  @OnEvent('round.settled')
  handleRoundSettled(data: RoundUpdate) {
    const room = `market:${data.marketSymbol}`;
    this.server.to(room).emit('round:settled', data);
    this.server.to(`round:${data.roundId}`).emit('round:settled', data);
    this.logger.debug(`Emitted round:settled to ${room}`);
  }

  @OnEvent('bet.placed')
  handleBetPlaced(data: BetPlacedEvent) {
    const room = `round:${data.round.id}`;
    // Broadcast pool updates (without exposing individual bet details)
    this.server.to(room).emit('pool:update', {
      roundId: data.round.id,
      totalUpPool: data.round.totalUpPool,
      totalDownPool: data.round.totalDownPool,
      upCount: data.round.upCount,
      downCount: data.round.downCount,
    });
    this.logger.debug(`Emitted pool:update to ${room}`);
  }

  // Manual price broadcast method (called from PriceService or scheduler)
  broadcastPrice(data: PriceUpdate) {
    const room = `market:${data.symbol}`;
    this.server.to(room).emit('price:update', data);
  }

  // Get connected client count
  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  // Get subscribed clients for a market
  getMarketSubscribers(symbol: string): number {
    let count = 0;
    for (const subscriptions of this.connectedClients.values()) {
      if (subscriptions.has(symbol)) {
        count++;
      }
    }
    return count;
  }
}
