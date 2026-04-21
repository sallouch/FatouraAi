import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { StockItem } from './stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private readonly stockRepo: Repository<StockItem>,
  ) {}

  // GET /stock
  async findAll(userId: string, search?: string, category?: string) {
    const where: any = { userId };
    if (search) where.name = Like(`%${search}%`);
    if (category) where.category = category;

    const items = await this.stockRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return items;
  }

  // GET /stock/:id
  async findOne(id: string, userId: string) {
    const item = await this.stockRepo.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Article introuvable');
    return item;
  }

  // POST /stock
  async create(dto: CreateStockDto, userId: string) {
    const item = this.stockRepo.create({ ...dto, userId });
    return this.stockRepo.save(item);
  }

  // PUT /stock/:id
  async update(id: string, dto: UpdateStockDto, userId: string) {
    await this.findOne(id, userId);
    await this.stockRepo.update(id, dto as any);
    return this.findOne(id, userId);
  }

  // DELETE /stock/:id
  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.stockRepo.delete(id);
    return { message: 'Article supprimé avec succès' };
  }
}
