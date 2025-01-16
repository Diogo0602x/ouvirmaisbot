import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';
import { ChatbotRequestDto } from '../dtos/chatbot-request.dto';

@Controller('webhook')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('whatsapp')
  async receiveMessage(@Body() body: ChatbotRequestDto) {
    console.log("Mensagem completa", body);
    const response = await this.chatbotService.handleMessage(body);
    return { status: 'Message processed successfully', response };
  }
}
