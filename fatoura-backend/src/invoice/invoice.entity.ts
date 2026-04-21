import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany,
} from 'typeorm';
import { User } from '../auth/auth.entity';

// ─── Statut facture ───────────────────────────────────────────────────────────
export enum InvoiceStatus {
  DRAFT   = 'draft',
  PENDING = 'pending',
  PAID    = 'paid',
  OVERDUE = 'overdue',
}

// ─── Devise ───────────────────────────────────────────────────────────────────
export enum InvoiceCurrency {
  MAD = 'MAD',
  TND = 'TND',
  EUR = 'EUR',
  USD = 'USD',
}

// ─── Facture ──────────────────────────────────────────────────────────────────
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: false })
  number: string; // ex: F-2026-0001

  @Column({ type: 'varchar', default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'varchar', default: InvoiceCurrency.MAD })
  currency: InvoiceCurrency;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'date' })
  dueDate: string;

  // ── Client ──────────────────────────────────────────────────────────────
  @Column()
  clientName: string;

  @Column()
  clientEmail: string;

  @Column({ nullable: true })
  clientPhone: string;

  @Column({ nullable: true })
  clientAddress: string;

  @Column({ nullable: true })
  clientTaxId: string;

  // ── Émetteur (sender) ────────────────────────────────────────────────────
  @Column({ nullable: true })
  senderName: string;

  @Column({ nullable: true })
  senderEmail: string;

  @Column({ nullable: true })
  senderPhone: string;

  @Column({ nullable: true })
  senderAddress: string;

  @Column({ nullable: true })
  senderTaxId: string;

  // ── Montants ─────────────────────────────────────────────────────────────
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0.20 })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  // ── Dates ────────────────────────────────────────────────────────────────
  @Column({ nullable: true, type: 'datetime' })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Relations ────────────────────────────────────────────────────────────
  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
    eager: true,
  })
  items: InvoiceItem[];

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: string;
}

// ─── Ligne de facture ─────────────────────────────────────────────────────────
@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0.20 })
  taxRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // quantity * unitPrice (HT)

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  invoice: Invoice;

  @Column()
  invoiceId: string;
}
