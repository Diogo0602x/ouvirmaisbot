import { Injectable } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { OpenAiService } from './openai.service';
import { ChatbotFlows } from '../flows/chatbot.flows';
import { getLocationInfo } from 'src/common/global-functions/cities';
import { EntenderDataHoraPrompt } from 'src/common/prompt/ouvirmais-promt';
@Injectable()
export class ChatbotService {
  private conversations: Record<string, { messages: string[]; state: any }> =
    {};

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly openAiService: OpenAiService,
  ) {}

  async handleMessage({
    From,
    Body,
    ProfileName,
  }: {
    From: string;
    Body: string;
    ProfileName: string;
  }) {
    const userId = From.replace(/\D/g, '');
    if (!this.conversations[userId]) {
      this.conversations[userId] = {
        messages: [],
        state: {
          location: null,
          selectedDate: null,
          selectedTime: null,
          appointmentConfirmed: false,
        },
      };
    }

    const userConversation = this.conversations[userId];
    userConversation.messages.push(`User: ${Body}`);
    let responseMessage = '';

    const isGreeting = /oi|olá|bom dia|boa tarde|boa noite/i.test(Body);
    const isConfirmation = /sim|claro|com certeza|ok|sim, desejo/i.test(
      Body.toLowerCase(),
    );
    const isSchedulingIntent = /agendar|consulta|horário/i.test(
      Body.toLowerCase(),
    );

    if (userConversation.state.appointmentConfirmed) {
      responseMessage = await this.openAiService.generateResponse(
        userConversation.messages.join('\n'),
      );
    } else if (isGreeting) {
      responseMessage = ChatbotFlows.welcome(ProfileName || userId).message;
    } else if (isConfirmation) {
      const availableDates = await this.simulateFetchAvailableDates();
      responseMessage = ChatbotFlows.schedule(availableDates).message;
      userConversation.state.availableDates = availableDates;
    } else if (isSchedulingIntent) {
      const availableDates = await this.simulateFetchAvailableDates();
      responseMessage = ChatbotFlows.schedule(availableDates).message;
      userConversation.state.availableDates = availableDates;
    } else if (userConversation.state.awaitingConfirmation) {
      // Interpretar data/hora usando GPT
      const result = await this.processSchedulingInputWithGPT(
        Body,
        userConversation.state.availableDates,
      );

      if (result.complete) {
        userConversation.state.selectedDate = result.date;
        userConversation.state.selectedTime = result.time;

        if (!userConversation.state.location) {
          responseMessage =
            'Por favor, informe a cidade para confirmarmos o agendamento.';
          userConversation.state.awaitingLocation = true;
        } else {
          responseMessage = this.generateConfirmationMessage(
            userConversation.state,
            ProfileName || userId,
          );
          userConversation.state.appointmentConfirmed = true;
        }
      } else {
        responseMessage =
          'Não consegui entender sua escolha de data e horário. Por favor, informe ambos de forma clara.';
      }
    } else if (userConversation.state.awaitingLocation) {
      const location = getLocationInfo(Body.trim().toLowerCase());
      if (location) {
        userConversation.state.location = Body.trim().toLowerCase();
        userConversation.state.awaitingLocation = false;

        responseMessage = this.generateConfirmationMessage(
          userConversation.state,
          ProfileName || userId,
        );
        userConversation.state.appointmentConfirmed = true;
      } else {
        responseMessage =
          'Não reconhecemos essa cidade. Por favor, informe uma cidade válida.';
      }
    } else {
      responseMessage = await this.openAiService.generateResponse(
        userConversation.messages.join('\n'),
      );
    }

    userConversation.messages.push(`Bot: ${responseMessage}`);
    await this.whatsappService.sendMessage(userId, responseMessage);

    return { response: responseMessage };
  }

  private async simulateFetchAvailableDates() {
    return [
      { date: '16/01 (terça-feira)', times: ['10:00', '14:00', '16:00'] },
      { date: '17/01 (quarta-feira)', times: ['09:00', '13:00', '15:00'] },
      { date: '18/01 (quinta-feira)', times: ['11:00', '14:30', '16:30'] },
    ];
  }

  private async processSchedulingInputWithGPT(
    input: string,
    availableDates: { date: string; times: string[] }[],
  ) {
    const gptPrompt = EntenderDataHoraPrompt(input, availableDates);

    const gptResponse = await this.openAiService.generateResponse(gptPrompt);
    try {
      return JSON.parse(gptResponse);
    } catch (error) {
      console.error('Erro ao processar a resposta do GPT:', error);
      return { complete: false };
    }
  }

  private generateConfirmationMessage(state: any, name: string) {
    const location = getLocationInfo(state.location);
    return ChatbotFlows.confirmSchedule({
      name,
      date: state.selectedDate,
      time: state.selectedTime,
      address: location?.address || 'Endereço não encontrado',
      phone: location?.phone || 'Telefone não encontrado',
    }).message;
  }
}
