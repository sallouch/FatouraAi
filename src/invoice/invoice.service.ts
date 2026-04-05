import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facture } from '../chatbot/entities/facture.entity';
import { LigneFacture } from '../chatbot/entities/ligne-facture.entity';
import { Produit } from '../chatbot/entities/produit.entity';
import { Client } from '../chatbot/entities/client.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Facture)
    private factureRepo: Repository<Facture>,
    @InjectRepository(LigneFacture)
    private ligneRepo: Repository<LigneFacture>,
    @InjectRepository(Produit)
    private produitRepo: Repository<Produit>,
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  // ── Catalogue produits ────────────────────────────────────────────────────

  async getCatalog() {
    const produits = await this.produitRepo.find({
      where: { est_actif: true },
    });

    const catalog: Record<string, any> = {};
    produits.forEach((p) => {
      catalog[p.designation] = {
        price: parseFloat(p.prix_unitaire_ht.toString()),
        ref: p.reference ?? p.id_produit,
        tva: parseInt(p.taux_tva),
        unit: p.unite,
        stock: 999, // stock à implémenter plus tard
      };
    });

    return { products: catalog };
  }

  // ── Récupérer toutes les factures ─────────────────────────────────────────

  async getAll() {
    return this.factureRepo.find({
      order: { date_creation: 'DESC' },
    });
  }

  // ── Récupérer une facture par id ──────────────────────────────────────────

  async getById(id: string) {
    const facture = await this.factureRepo.findOne({
      where: { id_facture: id },
    });
    const lignes = await this.ligneRepo.find({
      where: { id_facture: id },
    });
    return { ...facture, lignes };
  }
}