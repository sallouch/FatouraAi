import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ligneFacture')
export class LigneFacture {
  @PrimaryGeneratedColumn('uuid')
  id_ligne!: string;

  @Column()
  id_facture!: string;

  @Column({ nullable: true })
  id_produit!: string;

  @Column()
  designation!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 1 })
  quantite!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  prix_unitaire_ht!: number;

  @Column({ default: '19' })
  taux_tva!: string;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  montant_ht!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  montant_tva!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  montant_ttc!: number;
}