import { Injectable } from '@nestjs/common';
import { InvoiceService } from '../invoice/invoice.service';

@Injectable()
export class DashboardService {
  constructor(private readonly invoiceService: InvoiceService) {}

  async getSummary(userId: string) {
    const stats = await this.invoiceService.getStats(userId);
    return {
      ...stats,
      // Graphique des 6 derniers mois (données simplifiées — à enrichir)
      revenueByMonth: await this.getRevenueByMonth(userId),
    };
  }

  private async getRevenueByMonth(userId: string) {
    // Retourne les 6 derniers mois avec montant encaissé
    const months: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
        amount: 0, // TODO: requête SQL groupée par mois
      });
    }
    return months;
  }
}
