import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facture } from '../chatbot/entities/facture.entity';
import { LigneFacture } from '../chatbot/entities/ligne-facture.entity';
import { Produit } from '../chatbot/entities/produit.entity';
import { Client } from '../chatbot/entities/client.entity';

export type InvoiceStatus = 'pending' | 'sent_ttn' | 'sent_client';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  ref: string;
  unit: string;
  total: number;
}

export interface Invoice {
  id: string;
  client: string;
  clientEmail: string;
  items: InvoiceItem[];
  totalHT: number;
  tvaAmount: number;
  tva: number;
  total: number;
  date: string;
  status: InvoiceStatus;
  archived?: boolean;
  createdAt?: string;
}

export interface StockItem {
  id: string;
  name: string;
  ref: string;
  price: number;
  unit: string;
  stock: number;
  tva: number;
  alertThreshold?: number;
  category?: string;
}

export interface CreateStockItemRequest {
  name: string;
  ref: string;
  price: number;
  unit: string;
  stock: number;
  tva: number;
  alertThreshold?: number;
  category?: string;
}

export interface UpdateStockItemRequest {
  price?: number;
  stock?: number;
  alertThreshold?: number;
}

export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  sentTTNInvoices: number;
  sentClientInvoices: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  revenueChart: RevenueChartPoint[];
  recentInvoices: Invoice[];
}

export interface GetStockResponse {
  items: StockItem[];
  total: number;
}

@Injectable()
export class FatouraService {
  constructor(
    @InjectRepository(Facture)
    private readonly factureRepo: Repository<Facture>,
    @InjectRepository(LigneFacture)
    private readonly ligneRepo: Repository<LigneFacture>,
    @InjectRepository(Produit)
    private readonly produitRepo: Repository<Produit>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  private toInvoiceStatus(statut: string): InvoiceStatus {
    if (statut === 'envoyee_ttn' || statut === 'sent_ttn') return 'sent_ttn';
    if (statut === 'envoyee_client' || statut === 'sent_client') return 'sent_client';
    return 'pending';
  }

  private toIsoDate(value: Date | string | null | undefined): string {
    if (!value) return new Date().toISOString().slice(0, 10);
    return new Date(value).toISOString().slice(0, 10);
  }

  private async buildInvoices(factures: Facture[]): Promise<Invoice[]> {
    if (factures.length === 0) return [];

    const clientIds = Array.from(new Set(factures.map((f) => f.id_client).filter(Boolean)));
    const factureIds = factures.map((f) => f.id_facture);

    const [clients, lignes] = await Promise.all([
      clientIds.length
        ? this.clientRepo
            .createQueryBuilder('c')
            .where('c.id_client IN (:...clientIds)', { clientIds })
            .getMany()
        : Promise.resolve([]),
      this.ligneRepo
        .createQueryBuilder('l')
        .where('l.id_facture IN (:...factureIds)', { factureIds })
        .getMany(),
    ]);

    const clientMap = new Map(clients.map((c) => [c.id_client, c]));
    const lignesByFacture = new Map<string, LigneFacture[]>();

    for (const ligne of lignes) {
      const key = ligne.id_facture;
      const current = lignesByFacture.get(key) ?? [];
      current.push(ligne);
      lignesByFacture.set(key, current);
    }

    return factures.map((facture) => {
      const invoiceLines = (lignesByFacture.get(facture.id_facture) ?? []).map((l) => ({
        name: l.designation,
        quantity: Number(l.quantite),
        price: Number(l.prix_unitaire_ht),
        ref: l.id_produit ?? l.id_ligne,
        unit: 'unité',
        total: Number(l.montant_ttc || l.montant_ht || 0),
      }));

      const tvaAmount = Number(facture.montant_tva || 0);
      const totalHT = Number(facture.montant_ht || 0);
      const total = Number(facture.montant_ttc || totalHT + tvaAmount);
      const tva = totalHT > 0 ? Number(((tvaAmount / totalHT) * 100).toFixed(2)) : 19;
      const client = clientMap.get(facture.id_client);

      return {
        id: facture.id_facture,
        client: client?.nom ?? 'Client inconnu',
        clientEmail: client?.email ?? '',
        items: invoiceLines,
        totalHT,
        tvaAmount,
        tva,
        total,
        date: this.toIsoDate(facture.date_emission ?? facture.date_creation),
        status: this.toInvoiceStatus(facture.statut),
        archived: facture.statut === 'archivee',
        createdAt: facture.date_creation ? new Date(facture.date_creation).toISOString() : undefined,
      };
    });
  }

  private toStockItem(produit: Produit): StockItem {
    return {
      id: produit.id_produit,
      name: produit.designation,
      ref: produit.reference ?? produit.id_produit,
      price: Number(produit.prix_unitaire_ht),
      unit: produit.unite,
      stock: 999,
      tva: Number.parseInt(produit.taux_tva || '19', 10),
      category: produit.unite?.toLowerCase() === 'service' ? 'Services' : 'Produits',
    };
  }

  async getDashboard(): Promise<DashboardResponse> {
    const factures = await this.factureRepo.find({
      order: { date_creation: 'DESC' },
    });

    const mapped = await this.buildInvoices(factures);
    const active = mapped.filter((invoice) => !invoice.archived);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const monthBuckets = new Map<string, number>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.set(k, 0);
    }

    for (const invoice of active) {
      const d = new Date(`${invoice.date}T00:00:00`);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthBuckets.has(k)) {
        monthBuckets.set(k, Number((monthBuckets.get(k)! + invoice.total).toFixed(3)));
      }
    }

    const revenueThisMonth = active
      .filter((invoice) => {
        const d = new Date(`${invoice.date}T00:00:00`);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return k === currentMonth;
      })
      .reduce((sum, invoice) => sum + invoice.total, 0);

    const revenueLastMonth = active
      .filter((invoice) => {
        const d = new Date(`${invoice.date}T00:00:00`);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return k === previousMonth;
      })
      .reduce((sum, invoice) => sum + invoice.total, 0);

    return {
      stats: {
        totalInvoices: active.length,
        totalRevenue: Number(active.reduce((sum, invoice) => sum + invoice.total, 0).toFixed(3)),
        pendingInvoices: active.filter((invoice) => invoice.status === 'pending').length,
        sentTTNInvoices: active.filter((invoice) => invoice.status === 'sent_ttn').length,
        sentClientInvoices: active.filter((invoice) => invoice.status === 'sent_client').length,
        revenueThisMonth: Number(revenueThisMonth.toFixed(3)),
        revenueLastMonth: Number(revenueLastMonth.toFixed(3)),
      },
      revenueChart: Array.from(monthBuckets.entries()).map(([key, revenue]) => ({
        month: new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(new Date(`${key}-01`)),
        revenue,
      })),
      recentInvoices: active.slice(0, 5),
    };
  }

  async listStock(): Promise<GetStockResponse> {
    const produits = await this.produitRepo.find({
      where: { est_actif: true },
      order: { designation: 'ASC' },
    });

    const items = produits.map((p) => this.toStockItem(p));

    return {
      items,
      total: items.length,
    };
  }

  async getStockItem(id: string): Promise<StockItem> {
    const produit = await this.produitRepo.findOne({
      where: { id_produit: id, est_actif: true },
    });

    if (!produit) {
      throw new NotFoundException(`Article introuvable: ${id}`);
    }

    return this.toStockItem(produit);
  }

  async createStockItem(request: CreateStockItemRequest): Promise<StockItem> {
    if (!request.name?.trim()) {
      throw new BadRequestException('Le nom de l\'article est requis');
    }

    if (!Number.isFinite(request.price) || request.price < 0) {
      throw new BadRequestException('Le prix est invalide');
    }

    const produit = this.produitRepo.create({
      id_entreprise: 'default-company',
      reference: request.ref?.trim() || undefined,
      designation: request.name.trim(),
      unite: request.unit?.trim() || 'unité',
      prix_unitaire_ht: Number(request.price),
      taux_tva: String(request.tva ?? 19),
      est_actif: true,
    });

    const saved = await this.produitRepo.save(produit);
    return this.toStockItem(saved);
  }

  async updateStockItem(id: string, request: UpdateStockItemRequest): Promise<StockItem> {
    const produit = await this.produitRepo.findOne({
      where: { id_produit: id, est_actif: true },
    });

    if (!produit) {
      throw new NotFoundException(`Article introuvable: ${id}`);
    }

    if (typeof request.price === 'number') {
      if (!Number.isFinite(request.price) || request.price < 0) {
        throw new BadRequestException('Le prix est invalide');
      }
      produit.prix_unitaire_ht = request.price;
    }

    const updated = await this.produitRepo.save(produit);
    return this.toStockItem(updated);
  }

  async deleteStockItem(id: string): Promise<{ message: string }> {
    const produit = await this.produitRepo.findOne({
      where: { id_produit: id, est_actif: true },
    });

    if (!produit) {
      throw new NotFoundException(`Article introuvable: ${id}`);
    }

    produit.est_actif = false;
    await this.produitRepo.save(produit);

    return { message: 'Article supprimé' };
  }

  async answerChat(message: string): Promise<{ reply: string }> {
    const normalized = message.toLowerCase();
    const dashboard = await this.getDashboard();

    if (normalized.includes('facture') || normalized.includes('invoice')) {
      return {
        reply: `Vous avez ${dashboard.stats.totalInvoices} factures actives pour un total de ${dashboard.stats.totalRevenue.toFixed(3)} TND.`,
      };
    }

    if (normalized.includes('stock')) {
      const stock = await this.listStock();
      return {
        reply: `Le stock contient ${stock.total} article(s) actif(s).`,
      };
    }

    return {
      reply: `Résumé: ${dashboard.stats.totalInvoices} factures, ${dashboard.stats.pendingInvoices} en attente, ${dashboard.stats.sentClientInvoices} envoyées client.`,
    };
  }
}
