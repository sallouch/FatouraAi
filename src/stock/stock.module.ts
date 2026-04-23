import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { Produit } from '../chatbot/entities/produit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Produit])],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}