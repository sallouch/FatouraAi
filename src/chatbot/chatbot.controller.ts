import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async sendMessage(@Body() body: { message: string; history: any[] }) {
    return this.chatbotService.sendMessage(body.message, body.history || []);
  }
}