import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facture } from '../chatbot/entities/facture.entity';
import { LigneFacture } from '../chatbot/entities/ligne-facture.entity';
import { Produit } from '../chatbot/entities/produit.entity';
import { Client } from '../chatbot/entities/client.entity';
import { Company } from '../profile/company.entity';


@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
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
      const factures = await this.factureRepo
        .createQueryBuilder('f')
        .leftJoinAndMapOne('f.clientObj', Client, 'c', 'c.id_client = f.id_client')
        .orderBy('f.date_creation', 'DESC')
        .getMany();

      return factures.map((f: any) => ({
        id: f.id_facture,
        number: f.numero_facture,
        status: f.statut === 'brouillon' ? 'draft' : (f.statut ?? 'draft'),
        date: f.date_emission,
        dueDate: f.date_echeance,
        total: parseFloat(f.montant_ttc?.toString() ?? '0'),
        client: { name: f.clientObj?.nom ?? 'Client inconnu' },
      }));
    }
    async getNextNumber() {
  const last = await this.factureRepo.findOne({
    order: { date_creation: 'DESC' },
    where: {},
  });
  const year = new Date().getFullYear();
  const seq = last ? String(parseInt(last.numero_facture?.split('-')[2] ?? '0') + 1).padStart(5, '0') : '00001';
  return { number: `FAT-${year}-${seq}` };
}

async create(data: any, userId: string) {
  const company = await this.companyRepo.findOne({ where: { userId } });
  const entrepriseId = company?.id;

  const client = this.clientRepo.create({
    nom: data.client?.name ?? 'Client',
    email: data.client?.email,
    telephone: data.client?.phone,
    adresse: data.client?.address,
    matricule_fiscal: data.client?.taxId,
    id_entreprise: entrepriseId,
    est_actif: true,
  });
  const savedClient = await this.clientRepo.save(client);

  const facture = this.factureRepo.create({
    numero_facture: data.number,
    id_entreprise: entrepriseId,
    id_client: savedClient.id_client,
    statut: 'brouillon',
    date_emission: data.date,
    date_echeance: data.dueDate,
    montant_ht: data.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) ?? 0,
    montant_ttc:
      ((data.items?.reduce((s: number, i: any) => s + i.total, 0) ?? 0) *
        (1 + (data.taxRate ?? 0.19))),
  });
  return this.factureRepo.save(facture);
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
