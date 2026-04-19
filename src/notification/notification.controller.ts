import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, MarkReadDto } from './notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les notifications + unreadCount' })
  getAll() {
    return this.notificationService.getAll();
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Put('read')
  @ApiOperation({ summary: 'Marquer des notifications spécifiques comme lues' })
  markAsRead(@Body() dto: MarkReadDto) {
    return this.notificationService.markAsRead(dto);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  markAllAsRead() {
    return this.notificationService.markAllAsRead();
  }
}