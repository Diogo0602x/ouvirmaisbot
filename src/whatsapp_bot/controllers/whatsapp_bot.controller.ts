import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { WhatsAppMessageDto } from '../dtos/whatsapp_message.dto';
import { WhatsAppWebhookDto } from '../dtos/whatsapp_webhook.dto';
import { WhatsappBotService } from '../services/whatsapp_bot.service';

@Controller('webhook')
export class WhatsappBotController {
  constructor(private readonly whatsappBotService: WhatsappBotService) {}

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
  async receiveMessage(@Body() body: WhatsAppWebhookDto) {
    console.log('📩 Mensagem recebida:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;

      const messageEvent = change?.messages?.[0];
      const contacts = change?.contacts || [];

      console.log('🔍 Evento de mensagem:', messageEvent);

      if (messageEvent) {
        const whatsappRequest: WhatsAppMessageDto = {
          From: messageEvent.from,
          Body: messageEvent.text?.body || '',
          ProfileName: contacts?.[0]?.profile?.name || 'Usuário',
          Contacts: contacts,
          MessageId: messageEvent.id,
          Timestamp: messageEvent.timestamp,
        };

        return await this.whatsappBotService.handleMessage(whatsappRequest);
      }
    }

    return { status: 'ok' };
  }
}
