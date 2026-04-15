import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // GET /api/stock
  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.stockService.findAll(req.user.userId, search, category);
  }

  // GET /api/stock/:id
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.stockService.findOne(id, req.user.userId);
  }

  // POST /api/stock
  @Post()
  create(@Body() dto: CreateStockDto, @Request() req) {
    return this.stockService.create(dto, req.user.userId);
  }

  // PUT /api/stock/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStockDto, @Request() req) {
    return this.stockService.update(id, dto, req.user.userId);
  }

  // DELETE /api/stock/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.stockService.remove(id, req.user.userId);
  }
}
