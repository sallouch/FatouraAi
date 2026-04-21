import {
  IsString, IsEmail, IsOptional, IsNumber,
  IsEnum, IsArray, ValidateNested, Min, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, InvoiceCurrency } from '../invoice.entity';

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number; // ex: 0.20 = 20%
}

export class CreateInvoiceClientDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  taxId?: string;
}

export class CreateInvoiceSenderDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  taxId?: string;
}

export class CreateInvoiceDto {
  @IsString()
  number: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsEnum(InvoiceCurrency)
  currency: InvoiceCurrency;

  @IsDateString()
  date: string;

  @IsDateString()
  dueDate: string;

  @ValidateNested()
  @Type(() => CreateInvoiceClientDto)
  client: CreateInvoiceClientDto;

  @ValidateNested()
  @Type(() => CreateInvoiceSenderDto)
  @IsOptional()
  sender?: CreateInvoiceSenderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
