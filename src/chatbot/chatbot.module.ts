import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { Client } from './entities/client.entity';
import { Produit } from './entities/produit.entity';
import { Facture } from './entities/facture.entity';
import { LigneFacture } from './entities/ligne-facture.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Produit, Facture, LigneFacture]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}