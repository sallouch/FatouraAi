import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationType =
  | 'invoice_sent_ttn'
  | 'invoice_validated_ttn'
  | 'invoice_sent_client'
  | 'stock_low'
  | 'info';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: [
      'invoice_sent_ttn',
      'invoice_validated_ttn',
      'invoice_sent_client',
      'stock_low',
      'info',
    ],
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}