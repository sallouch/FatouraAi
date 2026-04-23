import { Controller, Post, Body, HttpException, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("chatbot")
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @UseGuards(JwtAuthGuard)
  @Post("message")
  async sendMessage(@Body() body: { message: string; history: any[] }, @Request() req: any) {
    try {
      return await this.chatbotService.sendMessage(body.message, body.history || [], req.user.sub);
    } catch (error: any) {
      if (error?.status === 503) {
        throw new HttpException(
          "Le service IA est temporairement surchargé. Réessaie dans quelques secondes.",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }
}
