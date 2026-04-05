import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('produit')
export class Produit {
  @PrimaryGeneratedColumn('uuid')
  id_produit!: string;

  @Column()
  id_entreprise!: string;

  @Column({ nullable: true })
  reference!: string;

  @Column()
  designation!: string;

  @Column({ default: 'unité' })
  unite!: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  prix_unitaire_ht!: number;

  @Column({ default: '19' })
  taux_tva!: string;

  @Column({ default: true })
  est_actif!: boolean;
}