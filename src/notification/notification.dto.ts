import { IsEnum, IsString, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationType =
  | 'invoice_sent_ttn'
  | 'invoice_validated_ttn'
  | 'invoice_sent_client'
  | 'stock_low'
  | 'info';

const NOTIFICATION_TYPES: NotificationType[] = [
  'invoice_sent_ttn',
  'invoice_validated_ttn',
  'invoice_sent_client',
  'stock_low',
  'info',
];

export class CreateNotificationDto {
  @ApiProperty({ enum: NOTIFICATION_TYPES, example: 'invoice_sent_client' })
  @IsEnum(NOTIFICATION_TYPES)
  type: NotificationType;

  @ApiProperty({ example: 'Facture envoyée' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'La facture INV-001 a été envoyée au client.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class MarkReadDto {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}