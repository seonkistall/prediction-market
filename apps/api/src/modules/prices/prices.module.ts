import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { BinanceProvider } from './providers/binance.provider';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { KISProvider } from './providers/kis.provider';

@Module({
  providers: [
    PricesService,
    BinanceProvider,
    YahooFinanceProvider,
    KISProvider,
  ],
  exports: [PricesService],
})
export class PricesModule {}
