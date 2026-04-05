import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('client')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id_client!: string;

  @Column()
  id_entreprise!: string;

  @Column()
  nom!: string;

  @Column({ nullable: true })
  matricule_fiscal!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  telephone!: string;

  @Column({ nullable: true })
  adresse!: string;

  @Column({ default: 'entreprise' })
  type_client!: string;

  @Column({ default: true })
  est_actif!: boolean;
}