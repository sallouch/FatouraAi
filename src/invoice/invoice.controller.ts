import { Controller, Get, Post, Param, Body, UseGuards, Request } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get("catalog")
  async getCatalog() {
    return this.invoiceService.getCatalog();
  }

  @Get("invoices/next-number")
  async getNextNumber() {
    return this.invoiceService.getNextNumber();
  }

  @Get("invoices")
  async getAll() {
    return this.invoiceService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post("invoices")
  async create(@Body() body: any, @Request() req: any) {
    return this.invoiceService.create(body, req.user.sub);
  }

  @Get("invoices/:id")
  async getById(@Param("id") id: string) {
    return this.invoiceService.getById(id);
  }
}