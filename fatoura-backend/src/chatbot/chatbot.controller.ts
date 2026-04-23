import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async sendMessage(@Body() body: { message: string; history: any[] }) {
    try {
      return await this.chatbotService.sendMessage(body.message, body.history || []);
    } catch (error: any) {
      if (error?.status === 503) {
        throw new HttpException(
          'Le service IA est temporairement surchargé. Réessaie dans quelques secondes.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }
}