import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { OuvirmaisbotPrompt } from 'src/common/prompt/ouvirmais-promt';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateResponse(conversation: string): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: OuvirmaisbotPrompt },
        { role: 'user', content: conversation },
      ],
      max_tokens: 200,
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const generatedText = response.data.choices[0].message.content.trim();
      this.logger.log(`Resposta gerada pelo GPT: ${generatedText}`);
      return generatedText;
    } catch (error) {
      this.logger.error(
        'Erro ao gerar resposta pelo GPT:',
        error.response?.data || error.message,
      );
      throw new Error('Erro ao gerar resposta pelo GPT.');
    }
  }
}
