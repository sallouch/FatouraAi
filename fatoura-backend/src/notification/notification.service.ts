import { Injectable } from '@nestjs/common';
import { InvoiceService } from '../invoice/invoice.service';
import { InvoiceStatus } from '../invoice/invoice.entity';

export interface Notification {
  id: string;
  type: 'overdue' | 'due_soon' | 'paid' | 'info';
  title: string;
  message: string;
  invoiceId?: string;
  invoiceNumber?: string;
  read: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly invoiceService: InvoiceService) {}

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data: invoices } = await this.invoiceService.findAll(userId, { limit: 100 });
    const notifications: Notification[] = [];
    const now = new Date();

    for (const inv of invoices) {
      const dueDate = new Date(inv.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Facture en retard
      if (inv.status === InvoiceStatus.OVERDUE || (inv.status === InvoiceStatus.PENDING && diffDays < 0)) {
        notifications.push({
          id:            `overdue-${inv.id}`,
          type:          'overdue',
          title:         'Facture en retard',
          message:       `La facture ${inv.number} (${inv.total} ${inv.currency}) est en retard de ${Math.abs(diffDays)} jour(s).`,
          invoiceId:     inv.id,
          invoiceNumber: inv.number,
          read:          false,
          createdAt:     new Date().toISOString(),
        });
      }
      // Échéance dans 7 jours
      else if (inv.status === InvoiceStatus.PENDING && diffDays >= 0 && diffDays <= 7) {
        notifications.push({
          id:            `due-soon-${inv.id}`,
          type:          'due_soon',
          title:         'Échéance proche',
          message:       `La facture ${inv.number} arrive à échéance dans ${diffDays} jour(s).`,
          invoiceId:     inv.id,
          invoiceNumber: inv.number,
          read:          false,
          createdAt:     new Date().toISOString(),
        });
      }
      // Facture payée récemment (< 3 jours)
      else if (inv.status === InvoiceStatus.PAID && inv.paidAt) {
        const paidDays = Math.ceil((now.getTime() - new Date(inv.paidAt).getTime()) / (1000 * 60 * 60 * 24));
        if (paidDays <= 3) {
          notifications.push({
            id:            `paid-${inv.id}`,
            type:          'paid',
            title:         'Paiement reçu',
            message:       `La facture ${inv.number} a été payée (${inv.total} ${inv.currency}).`,
            invoiceId:     inv.id,
            invoiceNumber: inv.number,
            read:          false,
            createdAt:     inv.paidAt.toString(),
          });
        }
      }
    }

    // Tri : non lues en premier, puis par date
    return notifications.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
