import { Module } from '@nestjs/common';
import { PredictionWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [PredictionWebSocketGateway],
  exports: [PredictionWebSocketGateway],
})
export class WebsocketModule {}
