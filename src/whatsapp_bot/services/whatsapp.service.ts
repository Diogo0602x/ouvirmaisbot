import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.configService.get<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
    );
    this.apiUrl = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
  }

  private formatPhoneNumber(phone: string): string {
    let formattedPhone = phone.replace(/\D/g, '');

    if (formattedPhone.startsWith('55') && formattedPhone.length === 12) {
      formattedPhone =
        formattedPhone.slice(0, 4) + '9' + formattedPhone.slice(4);
    }

    return formattedPhone;
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    this.logger.log(`📨 Tentando enviar mensagem para: ${formattedPhone}`);

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: message },
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(
        `✅ Mensagem enviada com sucesso: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      const errorData = error.response?.data || error.message;
      this.logger.error(`❌ Erro ao enviar mensagem:`, errorData);

      if (errorData?.error?.code === 131030) {
        this.logger.warn(
          `⚠️ O destinatário não está na janela de 24h. Tentando enviar um template...`,
        );
        await this.sendTemplateMessage(formattedPhone);
      } else {
        throw new Error('Falha ao enviar mensagem pelo WhatsApp API.');
      }
    }
  }

  async sendTemplateMessage(phone: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: 'hello_world',
        language: { code: 'en_US' },
      },
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      this.logger.log(
        `✅ Template enviado com sucesso: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Falha ao enviar template:`,
        error.response?.data || error.message,
      );
      throw new Error(
        'Falha ao enviar mensagem de template pelo WhatsApp API.',
      );
    }
  }
}
