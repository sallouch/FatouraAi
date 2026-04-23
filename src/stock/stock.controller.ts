import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StockService } from './stock.service';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('all')
  getAll() { return this.stockService.getAll(); }

  @Get(':id')
  getById(@Param('id') id: string) { return this.stockService.getById(id); }

  @Post()
  create(@Body() body: any) { return this.stockService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.stockService.update(id, body); }

  @Delete(':id')
  delete(@Param('id') id: string) { return this.stockService.delete(id); }
}