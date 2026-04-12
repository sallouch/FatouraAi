import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../auth/auth.entity';

@Entity('entreprise')
export class Company {
  @PrimaryGeneratedColumn('uuid', { name: 'id_entreprise' })
  id: string;

  @Column({ name: 'id_utilisateur' })
  userId: string;

  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'id_utilisateur' })
  user: User;

  @Column({ name: 'nom', nullable: true })
  nom: string;

  @Column({ name: 'matricule_fiscal', nullable: true })
  matriculeFiscal: string;

  @Column({ name: 'adresse', nullable: true })
  adresse: string;

  @Column({ name: 'code_postal', nullable: true })
  codePostal: string;

  @Column({ name: 'ville', nullable: true })
  ville: string;

  @Column({ name: 'pays', nullable: true })
  pays: string;

  @Column({ name: 'telephone', nullable: true })
  telephone: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'tva_number', nullable: true, array: true, type: 'text' })
  tvaNumber: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}