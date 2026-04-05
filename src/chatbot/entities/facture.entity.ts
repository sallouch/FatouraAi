import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('facture')
export class Facture {
  @PrimaryGeneratedColumn('uuid')
  id_facture!: string;

  @Column()
  numero_facture!: string;

  @Column()
  id_entreprise!: string;

  @Column()
  id_client!: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date_emission!: Date;

  @Column({ type: 'date', nullable: true })
  date_echeance!: Date;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  montant_ht!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  montant_tva!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  montant_ttc!: number;

  @Column({ default: 'brouillon' })
  statut!: string;

  @Column({ nullable: true })
  url_pdf!: string;

  @Column({ nullable: true })
  url_xml!: string;

  @Column({ nullable: true })
  signature_elec!: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  date_creation!: Date;
}