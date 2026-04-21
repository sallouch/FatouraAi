import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CreateInvoiceDto } from './create-invoice.dto';
import { InvoiceStatus } from '../invoice.entity';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsDateString()
  @IsOptional()
  paidAt?: string;
}
