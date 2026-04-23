import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { FatouraService } from '../shared/fatoura.service';
import { Facture } from '../chatbot/entities/facture.entity';
import { LigneFacture } from '../chatbot/entities/ligne-facture.entity';
import { Produit } from '../chatbot/entities/produit.entity';
import { Client } from '../chatbot/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facture, LigneFacture, Produit, Client])],
  controllers: [DashboardController],
  providers: [FatouraService],
})
export class DashboardModule {}
