import { PartialType } from '@nestjs/mapped-types';
import { CreateStockDto } from './create-stock.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStockDto extends PartialType(CreateStockDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
