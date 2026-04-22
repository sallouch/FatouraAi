import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Not } from 'typeorm';
import { Facture } from '../chatbot/entities/facture.entity';
import { LigneFacture } from '../chatbot/entities/ligne-facture.entity';
import { Produit } from '../chatbot/entities/produit.entity';
import { Client } from '../chatbot/entities/client.entity';

type InvoiceStatus = 'pending' | 'sent_ttn' | 'sent_client';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  ref: string;
  unit: string;
  total: number;
}

interface InvoiceDto {
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

@Injectable()
export class InvoiceService {
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

  private toStatus(statut: string): InvoiceStatus {
    if (statut === 'envoyee_ttn' || statut === 'sent_ttn') return 'sent_ttn';
    if (statut === 'envoyee_client' || statut === 'sent_client') return 'sent_client';
    return 'pending';
  }

  private async mapFacture(facture: Facture): Promise<InvoiceDto> {
    const [client, lignes] = await Promise.all([
      this.clientRepo.findOne({ where: { id_client: facture.id_client } }),
      this.ligneRepo.find({ where: { id_facture: facture.id_facture } }),
    ]);

    const items = lignes.map((l) => ({
      name: l.designation,
      quantity: Number(l.quantite),
      price: Number(l.prix_unitaire_ht),
      ref: l.id_produit ?? l.id_ligne,
      unit: 'unité',
      total: Number(l.montant_ttc || l.montant_ht || 0),
    }));

    const totalHT = Number(facture.montant_ht || 0);
    const tvaAmount = Number(facture.montant_tva || 0);
    const total = Number(facture.montant_ttc || totalHT + tvaAmount);
    const tva = totalHT > 0 ? Number(((tvaAmount / totalHT) * 100).toFixed(2)) : 19;

    return {
      id: facture.id_facture,
      client: client?.nom ?? 'Client inconnu',
      clientEmail: client?.email ?? '',
      items,
      totalHT,
      tvaAmount,
      tva,
      total,
      date: new Date(facture.date_emission ?? facture.date_creation).toISOString().slice(0, 10),
      status: this.toStatus(facture.statut),
      archived: facture.statut === 'archivee',
      createdAt: facture.date_creation ? new Date(facture.date_creation).toISOString() : undefined,
    };
  }

  async getCatalog() {
    const produits = await this.produitRepo.find({
      where: { est_actif: true },
    });

    const catalog: Record<string, any> = {};
    for (const p of produits) {
      catalog[p.designation] = {
        price: Number(p.prix_unitaire_ht),
        ref: p.reference ?? p.id_produit,
        tva: Number.parseInt(p.taux_tva || '19', 10),
        unit: p.unite,
        stock: 999,
      };
    }

    return { products: catalog };
  }

  async getAll(page = 1, pageSize = 20) {
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [rows, total] = await this.factureRepo.findAndCount({
      where: { statut: Not('archivee') },
      order: { date_creation: 'DESC' },
      take,
      skip,
    });

    const invoices = await Promise.all(rows.map((row) => this.mapFacture(row)));

    return {
      invoices,
      total,
      page: Math.max(1, page),
      pageSize: take,
    };
  }

  async getArchivedInvoices(page = 1, pageSize = 20) {
    const take = Math.max(1, Math.min(100, pageSize));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [rows, total] = await this.factureRepo.findAndCount({
      where: { statut: 'archivee' },
      order: { date_creation: 'DESC' },
      take,
      skip,
    });

    const invoices = await Promise.all(rows.map((row) => this.mapFacture(row)));

    return {
      invoices,
      total,
      page: Math.max(1, page),
      pageSize: take,
    };
  }

  async getById(id: string) {
    const facture = await this.factureRepo.findOne({ where: { id_facture: id } });
    if (!facture) {
      throw new NotFoundException(`Facture introuvable: ${id}`);
    }
    return this.mapFacture(facture);
  }

  async create(payload: {
    client: string;
    clientEmail: string;
    items: Array<{ name: string; quantity: number; price: number; ref: string; unit: string }>;
    tva: number;
  }) {
    if (!payload.client?.trim()) throw new BadRequestException('Le client est requis');
    if (!payload.clientEmail?.trim()) throw new BadRequestException("L'email client est requis");
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('Au moins un article est requis');
    }

    let client = await this.clientRepo.findOne({ where: { email: payload.clientEmail.trim() } });
    if (!client) {
      client = this.clientRepo.create({
        id_entreprise: 'default-company',
        nom: payload.client.trim(),
        email: payload.clientEmail.trim(),
        est_actif: true,
      });
      client = await this.clientRepo.save(client);
    }

    const totalHT = Number(
      payload.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(3),
    );
    const tva = Number(payload.tva ?? 19);
    const tvaAmount = Number(((totalHT * tva) / 100).toFixed(3));
    const total = Number((totalHT + tvaAmount).toFixed(3));

    const facture = this.factureRepo.create({
      numero_facture: `F-${new Date().getFullYear()}-${Date.now()}`,
      id_entreprise: 'default-company',
      id_client: client.id_client,
      date_emission: new Date(),
      montant_ht: totalHT,
      montant_tva: tvaAmount,
      montant_ttc: total,
      statut: 'brouillon',
    });

    const savedFacture = await this.factureRepo.save(facture);

    for (const item of payload.items) {
      const lineTotalHT = Number(item.price) * Number(item.quantity);
      const lineTva = Number(((lineTotalHT * tva) / 100).toFixed(3));

      const line = this.ligneRepo.create({
        id_facture: savedFacture.id_facture,
        id_produit: item.ref,
        designation: item.name,
        quantite: Number(item.quantity),
        prix_unitaire_ht: Number(item.price),
        taux_tva: String(tva),
        montant_ht: Number(lineTotalHT.toFixed(3)),
        montant_tva: lineTva,
        montant_ttc: Number((lineTotalHT + lineTva).toFixed(3)),
      });
      await this.ligneRepo.save(line);
    }

    const invoice = await this.mapFacture(savedFacture);

    return {
      invoice,
      message: 'Facture créée avec succès',
    };
  }

  async sendToTTN(invoiceId: string) {
    const facture = await this.factureRepo.findOne({ where: { id_facture: invoiceId } });
    if (!facture) throw new NotFoundException(`Facture introuvable: ${invoiceId}`);

    facture.statut = 'envoyee_ttn';
    const updated = await this.factureRepo.save(facture);

    return {
      invoice: await this.mapFacture(updated),
      message: 'Facture envoyée à TTN',
    };
  }

  async sendByEmail(id: string, email: string) {
    if (!email?.trim()) throw new BadRequestException('Email requis');

    const facture = await this.factureRepo.findOne({ where: { id_facture: id } });
    if (!facture) throw new NotFoundException(`Facture introuvable: ${id}`);

    const client = await this.clientRepo.findOne({ where: { id_client: facture.id_client } });
    if (client) {
      client.email = email.trim();
      await this.clientRepo.save(client);
    }

    facture.statut = 'envoyee_client';
    await this.factureRepo.save(facture);

    return { message: 'Facture envoyée au client' };
  }

  async delete(id: string) {
    await this.ligneRepo.delete({ id_facture: id });
    await this.factureRepo.delete({ id_facture: id });
    return { message: 'Facture supprimée' };
  }

  async archive(id: string) {
    const facture = await this.factureRepo.findOne({ where: { id_facture: id } });
    if (!facture) throw new NotFoundException(`Facture introuvable: ${id}`);

    facture.statut = 'archivee';
    const updated = await this.factureRepo.save(facture);

    return {
      invoice: await this.mapFacture(updated),
      message: 'Facture archivée',
    };
  }

  async unarchive(id: string) {
    const facture = await this.factureRepo.findOne({ where: { id_facture: id } });
    if (!facture) throw new NotFoundException(`Facture introuvable: ${id}`);

    facture.statut = 'brouillon';
    const updated = await this.factureRepo.save(facture);

    return {
      invoice: await this.mapFacture(updated),
      message: 'Facture désarchivée',
    };
  }

  async getXml(id: string) {
    const invoice = await this.getById(id);

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <Id>${invoice.id}</Id>
  <Client>${invoice.client}</Client>
  <ClientEmail>${invoice.clientEmail}</ClientEmail>
  <Date>${invoice.date}</Date>
  <Status>${invoice.status}</Status>
  <TotalHT>${invoice.totalHT.toFixed(3)}</TotalHT>
  <TVA>${invoice.tva.toFixed(2)}</TVA>
  <TVAAmount>${invoice.tvaAmount.toFixed(3)}</TVAAmount>
  <Total>${invoice.total.toFixed(3)}</Total>
</Invoice>`;
  }

  async getPdf(id: string) {
    const invoice = await this.getById(id);

    const pdfLike = [
      '%PDF-1.4',
      '1 0 obj',
      '<< /Type /Catalog /Pages 2 0 R >>',
      'endobj',
      '2 0 obj',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      'endobj',
      '3 0 obj',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>',
      'endobj',
      '4 0 obj',
      '<< /Length 120 >>',
      'stream',
      `Invoice ${invoice.id} - ${invoice.client} - ${invoice.total.toFixed(3)} TND`,
      'endstream',
      'endobj',
      'trailer',
      '<< /Root 1 0 R /Size 5 >>',
      '%%EOF',
    ].join('\n');

    return Buffer.from(pdfLike, 'utf-8');
  }
}
