import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendMessage(phone: string, message: string): Promise<void> {
    this.logger.log(`Enviando mensagem para: ${phone}`);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.configService.get('TWILIO_ACCOUNT_SID')}/Messages.json`;

    const auth = {
      username: this.configService.get('TWILIO_ACCOUNT_SID'),
      password: this.configService.get('TWILIO_AUTH_TOKEN'),
    };

    const payload = new URLSearchParams();
    payload.append('To', `whatsapp:${phone}`);
    payload.append('From', `whatsapp:${this.configService.get('TWILIO_PHONE_NUMBER')}`);
    payload.append('Body', message);

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload.toString(), {
          auth,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      this.logger.log('Mensagem enviada com sucesso:', response.data);
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp message');
    }
  }
}
