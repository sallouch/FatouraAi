import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Invoice, InvoiceItem, InvoiceStatus } from './invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepo: Repository<InvoiceItem>,
  ) {}

  // ─── Calcul des montants ─────────────────────────────────────────────────
  private computeTotals(items: { quantity: number; unitPrice: number; taxRate?: number }[], globalTaxRate: number) {
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = subtotal * globalTaxRate;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }

  // ─── Sérialisation vers le format attendu par le frontend ────────────────
  private format(inv: Invoice) {
    return {
      id:         inv.id,
      number:     inv.number,
      status:     inv.status,
      currency:   inv.currency,
      date:       inv.date,
      dueDate:    inv.dueDate,
      taxRate:    inv.taxRate,
      subtotal:   Number(inv.subtotal),
      taxAmount:  Number(inv.taxAmount),
      total:      Number(inv.total),
      notes:      inv.notes,
      createdAt:  inv.createdAt,
      updatedAt:  inv.updatedAt,
      paidAt:     inv.paidAt,
      client: {
        name:    inv.clientName,
        email:   inv.clientEmail,
        phone:   inv.clientPhone,
        address: inv.clientAddress,
        taxId:   inv.clientTaxId,
      },
      sender: inv.senderName ? {
        name:    inv.senderName,
        email:   inv.senderEmail,
        phone:   inv.senderPhone,
        address: inv.senderAddress,
        taxId:   inv.senderTaxId,
      } : null,
      items: (inv.items ?? []).map((item) => ({
        id:          item.id,
        description: item.description,
        quantity:    Number(item.quantity),
        unitPrice:   Number(item.unitPrice),
        taxRate:     Number(item.taxRate),
        total:       Number(item.total),
      })),
    };
  }

  // ─── GET /invoices ────────────────────────────────────────────────────────
  async findAll(userId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page  = params.page  ?? 1;
    const limit = params.limit ?? 20;
    const skip  = (page - 1) * limit;

    const qb = this.invoiceRepo.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.userId = :userId', { userId });

    if (params.status && params.status !== 'all') {
      qb.andWhere('invoice.status = :status', { status: params.status });
    }
    if (params.search) {
      qb.andWhere(
        '(invoice.clientName ILIKE :search OR invoice.number ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    const sortField = params.sortBy ?? 'createdAt';
    const sortOrder = (params.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    qb.orderBy(`invoice.${sortField}`, sortOrder);

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data:       data.map((inv) => this.format(inv)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── GET /invoices/next-number ────────────────────────────────────────────
  async getNextNumber(userId: string) {
    const year  = new Date().getFullYear();
    const count = await this.invoiceRepo.count({ where: { userId } });
    const num   = String(count + 1).padStart(4, '0');
    return { number: `F-${year}-${num}` };
  }

  // ─── GET /invoices/:id ────────────────────────────────────────────────────
  async findOne(id: string, userId: string) {
    const inv = await this.invoiceRepo.findOne({
      where: { id, userId },
      relations: ['items'],
    });
    if (!inv) throw new NotFoundException('Facture introuvable');
    return this.format(inv);
  }

  // ─── POST /invoices ───────────────────────────────────────────────────────
  async create(dto: CreateInvoiceDto, userId: string) {
    const taxRate = dto.taxRate ?? 0.20;
    const { subtotal, taxAmount, total } = this.computeTotals(dto.items, taxRate);

    const invoice = this.invoiceRepo.create({
      number:   dto.number,
      status:   dto.status ?? InvoiceStatus.PENDING,
      currency: dto.currency,
      date:     dto.date,
      dueDate:  dto.dueDate,
      taxRate,
      subtotal,
      taxAmount,
      total,
      notes:    dto.notes,
      userId,
      // client
      clientName:    dto.client.name,
      clientEmail:   dto.client.email,
      clientPhone:   dto.client.phone,
      clientAddress: dto.client.address,
      clientTaxId:   dto.client.taxId,
      // sender
      senderName:    dto.sender?.name,
      senderEmail:   dto.sender?.email,
      senderPhone:   dto.sender?.phone,
      senderAddress: dto.sender?.address,
      senderTaxId:   dto.sender?.taxId,
      // items
      items: dto.items.map((i) => ({
        description: i.description,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        taxRate:     i.taxRate ?? taxRate,
        total:       i.quantity * i.unitPrice,
      })),
    });

    const saved = await this.invoiceRepo.save(invoice);
    return this.findOne(saved.id, userId);
  }

  // ─── PATCH /invoices/:id ──────────────────────────────────────────────────
  async update(id: string, dto: UpdateInvoiceDto, userId: string) {
    const inv = await this.invoiceRepo.findOne({
      where: { id, userId },
      relations: ['items'],
    });
    if (!inv) throw new NotFoundException('Facture introuvable');

    // Mise à jour des items si fournis
    if (dto.items) {
      await this.itemRepo.delete({ invoiceId: id });
      const taxRate = dto.taxRate ?? inv.taxRate;
      const { subtotal, taxAmount, total } = this.computeTotals(dto.items, taxRate);

      const newItems = dto.items.map((i) =>
        this.itemRepo.create({
          description: i.description,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          taxRate:     i.taxRate ?? taxRate,
          total:       i.quantity * i.unitPrice,
          invoiceId:   id,
        })
      );
      await this.itemRepo.save(newItems);

      await this.invoiceRepo.update(id, {
        subtotal, taxAmount, total,
        taxRate: dto.taxRate ?? inv.taxRate,
      });
    }

    // Mise à jour des autres champs
    const updateData: Partial<Invoice> = {};
    if (dto.status)   updateData.status   = dto.status;
    if (dto.currency) updateData.currency = dto.currency;
    if (dto.date)     updateData.date     = dto.date;
    if (dto.dueDate)  updateData.dueDate  = dto.dueDate;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.client) {
      updateData.clientName    = dto.client.name;
      updateData.clientEmail   = dto.client.email;
      updateData.clientPhone   = dto.client.phone;
      updateData.clientAddress = dto.client.address;
      updateData.clientTaxId   = dto.client.taxId;
    }
    if (dto.sender) {
      updateData.senderName    = dto.sender.name;
      updateData.senderEmail   = dto.sender.email;
      updateData.senderPhone   = dto.sender.phone;
      updateData.senderAddress = dto.sender.address;
      updateData.senderTaxId   = dto.sender.taxId;
    }

    if (Object.keys(updateData).length > 0) {
      await this.invoiceRepo.update(id, updateData);
    }

    return this.findOne(id, userId);
  }

  // ─── DELETE /invoices/:id ─────────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const inv = await this.invoiceRepo.findOne({ where: { id, userId } });
    if (!inv) throw new NotFoundException('Facture introuvable');
    await this.invoiceRepo.delete(id);
    return { message: 'Facture supprimée avec succès' };
  }

  // ─── POST /invoices/:id/mark-paid ─────────────────────────────────────────
  async markPaid(id: string, userId: string, paidAt?: string) {
    const inv = await this.invoiceRepo.findOne({ where: { id, userId } });
    if (!inv) throw new NotFoundException('Facture introuvable');
    await this.invoiceRepo.update(id, {
      status: InvoiceStatus.PAID,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
    });
    return this.findOne(id, userId);
  }

  // ─── POST /invoices/:id/send ──────────────────────────────────────────────
  async sendByEmail(id: string, userId: string, recipientEmail?: string) {
    const inv = await this.invoiceRepo.findOne({ where: { id, userId } });
    if (!inv) throw new NotFoundException('Facture introuvable');

    const email = recipientEmail ?? inv.clientEmail;
    // TODO: intégrer un service mail (nodemailer / SendGrid / Brevo)
    console.log(`📧 Envoi facture ${inv.number} à ${email}`);

    // Passer le statut en pending si c'était un brouillon
    if (inv.status === InvoiceStatus.DRAFT) {
      await this.invoiceRepo.update(id, { status: InvoiceStatus.PENDING });
    }

    return { message: `Email envoyé avec succès à ${email}` };
  }

  // ─── Stats pour dashboard ─────────────────────────────────────────────────
  async getStats(userId: string) {
    const all = await this.invoiceRepo.find({ where: { userId } });

    const total        = all.length;
    const paid         = all.filter((i) => i.status === InvoiceStatus.PAID);
    const pending      = all.filter((i) => i.status === InvoiceStatus.PENDING);
    const overdue      = all.filter((i) => i.status === InvoiceStatus.OVERDUE);
    const draft        = all.filter((i) => i.status === InvoiceStatus.DRAFT);
    const totalAmount  = all.reduce((s, i) => s + Number(i.total), 0);
    const paidAmount   = paid.reduce((s, i) => s + Number(i.total), 0);

    return {
      total,
      paid:         paid.length,
      pending:      pending.length,
      overdue:      overdue.length,
      draft:        draft.length,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    };
  }
}
