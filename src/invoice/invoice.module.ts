import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { Facture } from '../chatbot/entities/facture.entity';
import { LigneFacture } from '../chatbot/entities/ligne-facture.entity';
import { Produit } from '../chatbot/entities/produit.entity';
import { Client } from '../chatbot/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facture, LigneFacture, Produit, Client]),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}