import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('catalog')
  async getCatalog() {
    return this.invoiceService.getCatalog();
  }

  @Get('invoices')
  async getAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<any> {
    const p = page ? Number.parseInt(page, 10) : 1;
    const ps = pageSize ? Number.parseInt(pageSize, 10) : 20;
    return this.invoiceService.getAll(p, ps);
  }

  @Get('invoices/archived')
  async getArchived(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<any> {
    const p = page ? Number.parseInt(page, 10) : 1;
    const ps = pageSize ? Number.parseInt(pageSize, 10) : 20;
    return this.invoiceService.getArchivedInvoices(p, ps);
  }

  @Get('invoices/:id')
  async getById(@Param('id') id: string): Promise<any> {
    return this.invoiceService.getById(id);
  }

  @Post('invoices')
  async create(@Body() body: { client: string; clientEmail: string; items: any[]; tva: number }): Promise<any> {
    return this.invoiceService.create(body);
  }

  @Post('invoices/ttn')
  async sendToTTN(@Body() body: { invoiceId: string }): Promise<any> {
    return this.invoiceService.sendToTTN(body.invoiceId);
  }

  @Post('invoices/:id/send')
  async sendByEmail(@Param('id') id: string, @Body() body: { email: string }): Promise<any> {
    return this.invoiceService.sendByEmail(id, body.email);
  }

  @Delete('invoices/:id')
  async delete(@Param('id') id: string): Promise<any> {
    return this.invoiceService.delete(id);
  }

  @Post('invoices/:id/archive')
  async archive(@Param('id') id: string): Promise<any> {
    return this.invoiceService.archive(id);
  }

  @Post('invoices/:id/unarchive')
  async unarchive(@Param('id') id: string): Promise<any> {
    return this.invoiceService.unarchive(id);
  }

  @Get('invoices/:id/xml')
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename="invoice.xml"')
  async downloadXml(@Param('id') id: string): Promise<string> {
    return this.invoiceService.getXml(id);
  }

  @Get('invoices/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="invoice.pdf"')
  async downloadPdf(@Param('id') id: string): Promise<Buffer> {
    return this.invoiceService.getPdf(id);
  }
}
