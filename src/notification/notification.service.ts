import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateNotificationDto, MarkReadDto } from './notification.dto';

// ─── Types alignés avec le frontend ──────────────────────────────────────────
export type NotificationType =
  | 'invoice_sent_ttn'
  | 'invoice_validated_ttn'
  | 'invoice_sent_client'
  | 'stock_low'
  | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ─── Type brut retourné par Supabase (snake_case) ─────────────────────────────
interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Mapping snake_case → camelCase pour le front
const toNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  read: row.read,
  createdAt: row.created_at,
});

@Injectable()
export class NotificationService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get db() {
    return this.supabaseService.getClient();
  }

  // ─── GET /notifications ───────────────────────────────────────────────────
  async getAll(): Promise<GetNotificationsResponse> {
    const { data, error } = await this.db
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    const notifications = (data as NotificationRow[]).map(toNotification);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount };
  }

  // ─── POST /notifications ──────────────────────────────────────────────────
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const { data, error } = await this.db
      .from('notifications')
      .insert({ type: dto.type, title: dto.title, message: dto.message })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return toNotification(data as NotificationRow);
  }

  // ─── PUT /notifications/read ──────────────────────────────────────────────
  async markAsRead(dto: MarkReadDto): Promise<{ message: string }> {
    const { data, error } = await this.db
      .from('notifications')
      .update({ read: true })
      .in('id', dto.ids)
      .select();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data || data.length === 0)
      throw new NotFoundException('Aucune notification trouvée pour ces IDs');

    return { message: `${data.length} notification(s) marquée(s) comme lue(s)` };
  }

  // ─── PUT /notifications/read-all ─────────────────────────────────────────
  async markAllAsRead(): Promise<{ message: string }> {
    const { error } = await this.db
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) throw new InternalServerErrorException(error.message);

    return { message: 'Toutes les notifications ont été marquées comme lues' };
  }
}