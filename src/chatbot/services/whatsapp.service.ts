import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    this.phoneNumberId = this.configService.get<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
    );

    this.apiUrl = `https://graph.facebook.com/${this.configService.get<string>(
      'WHATSAPP_VERSION',
    )}/${this.phoneNumberId}/messages`;
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    this.logger.log(`Enviando mensagem para: ${phone}`);

    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: phone.replace(/\D/g, ''),
      type: 'text',
      text: { body: message },
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(
        `Mensagem enviada com sucesso: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      this.logger.error(
        'Erro ao enviar mensagem:',
        error.response?.data || error.message,

        error.response?.data || error.message,
      );
      throw new Error('Falha ao enviar mensagem pelo WhatsApp API.');
    }
  }
}
