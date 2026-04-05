import { Controller, Get, Param } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('catalog')
  async getCatalog() {
    return this.invoiceService.getCatalog();
  }

  @Get('invoices')
  async getAll() {
    return this.invoiceService.getAll();
  }

  @Get('invoices/:id')
  async getById(@Param('id') id: string) {
    return this.invoiceService.getById(id);
  }
}