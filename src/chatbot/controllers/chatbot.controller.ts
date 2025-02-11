import { Controller, Get, Post, Query, Body, Res } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';
import { ChatbotRequestDto } from '../dtos/chatbot-request.dto';

@Controller('webhook')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res,
  ) {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFICADO COM SUCESSO!');
      return res.status(200).send(challenge);
    } else {
      console.error('❌ Falha na verificação do webhook.');
      return res.status(403).send('Falha na verificação');
    }
  }

  @Post('whatsapp')
  async receiveMessage(@Body() body: any) {
    console.log('📩 Mensagem recebida:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;

      const messageEvent = change?.messages?.[0];
      const contacts = change?.contacts || [];

      console.log('🔍 Evento de mensagem:', messageEvent);

      if (messageEvent) {
        const senderId = messageEvent.from;
        const messageText = messageEvent.text?.body || '';

        const chatbotRequest: ChatbotRequestDto = {
          From: senderId,
          Body: messageText,
          ProfileName: contacts?.[0]?.profile?.name || 'Usuário',
          Contacts: contacts,
        };

        return await this.chatbotService.handleMessage(chatbotRequest);
      }
    }

    return { status: 'ok' };
  }
}
