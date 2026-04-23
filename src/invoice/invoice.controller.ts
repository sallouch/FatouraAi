import { Controller, Get, Param, UseGuards, Request } from "@nestjs/common";
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
    return { nextNumber: "FAC-001" };
  }

  @Get("invoices")
  async getAll() {
    return this.invoiceService.getAll();
  }

  @Get("invoices/:id")
  async getById(@Param("id") id: string) {
    return this.invoiceService.getById(id);
  }
}
