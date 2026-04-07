import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenAI } from '@google/genai';
import { Client } from './entities/client.entity';
import { Produit } from './entities/produit.entity';
import { Facture } from './entities/facture.entity';
import { LigneFacture } from './entities/ligne-facture.entity';

@Injectable()
export class ChatbotService {
  private ai: GoogleGenAI;

  constructor(
    private config: ConfigService,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    @InjectRepository(Produit)
    private produitRepo: Repository<Produit>,
    @InjectRepository(Facture)
    private factureRepo: Repository<Facture>,
    @InjectRepository(LigneFacture)
    private ligneRepo: Repository<LigneFacture>,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get('GEMINI_API_KEY'),
    });
  }

  // ── Outils réels ──────────────────────────────────────────

  private async getClients(nom: string) {
    return this.clientRepo
      .createQueryBuilder('c')
      .where('c.nom ILIKE :nom', { nom: `%${nom}%` })
      .andWhere('c.est_actif = true')
      .getMany();
  }

  private async getProduits(recherche: string) {
    return this.produitRepo
      .createQueryBuilder('p')
      .where('p.designation ILIKE :r', { r: `%${recherche}%` })
      .orWhere('p.reference ILIKE :r', { r: `%${recherche}%` })
      .andWhere('p.est_actif = true')
      .getMany();
  }

  private async createInvoice(data: {
    id_entreprise: string;
    id_client: string;
    items: { id_produit: string; quantite: number }[];
  }) {
    const result = await this.factureRepo.query(
      `SELECT generer_numero_facture($1) as numero`,
      [data.id_entreprise],
    );
    const numero = result[0].numero;

    const facture = this.factureRepo.create({
      numero_facture: numero,
      id_entreprise: data.id_entreprise,
      id_client: data.id_client,
      statut: 'brouillon',
    });
    const savedFacture = await this.factureRepo.save(facture);

    for (const item of data.items) {
      const produit = await this.produitRepo.findOne({
        where: { id_produit: item.id_produit },
      });
      if (produit) {
        const ligne = this.ligneRepo.create({
          id_facture: savedFacture.id_facture,
          id_produit: produit.id_produit,
          designation: produit.designation,
          quantite: item.quantite,
          prix_unitaire_ht: produit.prix_unitaire_ht,
          taux_tva: produit.taux_tva,
        });
        await this.ligneRepo.save(ligne);
      }
    }

    return this.factureRepo.findOne({
      where: { id_facture: savedFacture.id_facture },
    });
  }

  // ── Déclarations des outils pour Gemini ──────────────────

  private tools: any[] = [
    {
      name: 'get_clients',
      description: 'Chercher un client par son nom',
      parameters: {
        type: 'object',
        properties: {
          nom: { type: 'string', description: 'Nom ou partie du nom du client' },
        },
        required: ['nom'],
      },
    },
    {
      name: 'get_produits',
      description: 'Chercher des produits par nom ou référence',
      parameters: {
        type: 'object',
        properties: {
          recherche: { type: 'string', description: 'Nom ou référence du produit' },
        },
        required: ['recherche'],
      },
    },
    {
      name: 'create_invoice',
      description: 'Créer une facture après confirmation du client',
      parameters: {
        type: 'object',
        properties: {
          id_entreprise: { type: 'string' },
          id_client: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_produit: { type: 'string' },
                quantite: { type: 'number' },
              },
            },
          },
        },
        required: ['id_entreprise', 'id_client', 'items'],
      },
    },
  ];

  // ── Exécuter l'outil appelé par Gemini ───────────────────

  private async executeTool(name: string, args: any) {
    switch (name) {
      case 'get_clients':
        return await this.getClients(args.nom);
      case 'get_produits':
        return await this.getProduits(args.recherche);
      case 'create_invoice':
        return await this.createInvoice(args);
      default:
        return { error: 'Outil inconnu' };
    }
  }

  // ── Extraire le texte d'une réponse Gemini ───────────────

  private extractText(response: any): string {
    return response.candidates?.[0]?.content?.parts
      ?.filter((p: any) => p.text)
      ?.map((p: any) => p.text)
      ?.join('') ?? '';
  }

  // ── Point d'entrée principal ──────────────────────────────

  async sendMessage(message: string, history: any[]) {
    try {
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: message }] },
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: `Tu es un assistant de facturation pour une entreprise tunisienne.
Tu aides à créer des factures en posant des questions simples.
Les montants sont en Dinars Tunisiens (TND) avec 3 décimales.
Parle toujours en français.
Avant de créer une facture, montre toujours un récapitulatif et demande confirmation.`,
          tools: [{ functionDeclarations: this.tools }],
        },
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Vérifier si Gemini veut appeler un outil
      for (const part of parts) {
        if (part.functionCall) {
          const toolName = part.functionCall.name ?? '';
          const toolArgs = part.functionCall.args;

          // Exécuter l'outil
          const toolResult = await this.executeTool(toolName, toolArgs);

          // Renvoyer le résultat à Gemini
          const finalResponse = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              ...contents,
              { role: 'model', parts: [part] },
              {
                role: 'user',
                parts: [{
                  functionResponse: {
                    name: toolName,
                    response: { result: toolResult },
                  },
                }],
              },
            ],
            config: {
              systemInstruction: `Tu es un assistant de facturation pour une entreprise tunisienne.
Parle toujours en français.
Avant de créer une facture, montre toujours un récapitulatif et demande confirmation.`,
            },
          });

          const finalText = this.extractText(finalResponse);
          const invoice = toolName === 'create_invoice' ? toolResult : null;

          return {
            response: finalText,
            invoice,
            history: [
              ...contents,
              { role: 'model', parts: [{ text: finalText }] },
            ],
          };
        }
      }

      // Réponse texte simple
      const textResponse = this.extractText(response);

      return {
        response: textResponse,
        invoice: null,
        history: [
          ...contents,
          { role: 'model', parts: [{ text: textResponse }] },
        ],
      };

    } catch (error) {
      console.error('ERREUR CHATBOT:', error);
      throw error;
    }
  }
}