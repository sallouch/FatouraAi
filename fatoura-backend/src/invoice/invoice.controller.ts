import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  // GET /api/invoices/next-number  ← DOIT être avant /:id
  @Get('next-number')
  getNextNumber(@Request() req) {
    return this.invoiceService.getNextNumber(req.user.userId);
  }

  // GET /api/invoices
  @Get()
  findAll(
    @Request() req,
    @Query('page')      page?: string,
    @Query('limit')     limit?: string,
    @Query('status')    status?: string,
    @Query('search')    search?: string,
    @Query('sortBy')    sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.invoiceService.findAll(req.user.userId, {
      page:      page  ? parseInt(page)  : undefined,
      limit:     limit ? parseInt(limit) : undefined,
      status,
      search,
      sortBy,
      sortOrder,
    });
  }

  // GET /api/invoices/:id
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoiceService.findOne(id, req.user.userId);
  }

  // POST /api/invoices
  @Post()
  create(@Body() dto: CreateInvoiceDto, @Request() req) {
    return this.invoiceService.create(dto, req.user.userId);
  }

  // PATCH /api/invoices/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto, @Request() req) {
    return this.invoiceService.update(id, dto, req.user.userId);
  }

  // DELETE /api/invoices/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.invoiceService.remove(id, req.user.userId);
  }

  // POST /api/invoices/:id/mark-paid
  @Post(':id/mark-paid')
  markPaid(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { paidAt?: string },
  ) {
    return this.invoiceService.markPaid(id, req.user.userId, body?.paidAt);
  }

  // POST /api/invoices/:id/send
  @Post(':id/send')
  sendByEmail(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { recipientEmail?: string },
  ) {
    return this.invoiceService.sendByEmail(id, req.user.userId, body?.recipientEmail);
  }

  // GET /api/invoices/:id/pdf
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceService.findOne(id, req.user.userId);

    // ── Génération PDF simple en HTML → à remplacer par puppeteer/pdfkit ──
    const html = `
      <html><body>
        <h1>FACTURE ${invoice.number}</h1>
        <p>Client: ${invoice.client.name}</p>
        <p>Total: ${invoice.total} ${invoice.currency}</p>
      </body></html>
    `;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
    // TODO: remplacer par génération PDF réelle (puppeteer / pdfkit)
    res.send(Buffer.from(html));
  }
}
