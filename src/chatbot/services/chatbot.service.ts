import { Injectable } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { OpenAiService } from './openai.service';
import { ChatbotFlows } from '../flows/chatbot.flows';
import { getLocationInfo, getMockedCity } from 'src/common/global-functions/cities';
import { EntenderDataHoraPrompt } from 'src/common/prompt/ouvirmais-promt';

@Injectable()
export class ChatbotService {
  private conversations: Record<string, { messages: string[]; state: any }> = {};

  constructor(
    private readonly twilioService: TwilioService,
    private readonly openAiService: OpenAiService,
  ) {}

  async handleMessage({ From, Body, ProfileName }: { From: string; Body: string; ProfileName: string }) {
    const userId = From.replace('whatsapp:', '');

    if (!this.conversations[userId]) {
      this.conversations[userId] = {
        messages: [],
        state: {
          location: null,
          selectedDate: null,
          selectedTime: null,
          awaitingConfirmation: false,
          awaitingLocation: false,
          appointmentConfirmed: false,
        },
      };
    }

    const userConversation = this.conversations[userId];
    userConversation.messages.push(`User: ${Body}`);
    let responseMessage = '';

    const isGreeting = /oi|olá|bom dia|boa tarde|boa noite/i.test(Body);
    const isConfirmation = /sim|claro|com certeza|ok|sim, desejo/i.test(Body.toLowerCase());
    const isSchedulingIntent = /agendar|consulta|horário/i.test(Body.toLowerCase());
    const isProvidingCity = userConversation.state.awaitingLocation;
    const isProvidingDateTime = userConversation.state.awaitingConfirmation;

    if (userConversation.state.appointmentConfirmed) {
      // Respostas após a confirmação do agendamento
      const history = userConversation.messages.join('\n');
      responseMessage = await this.openAiService.generateResponse(history);
    } else if (isGreeting) {
      responseMessage = ChatbotFlows.welcome(ProfileName || userId).message;
    } else if (isConfirmation && !userConversation.state.appointmentConfirmed) {
      // Confirmar intenção de agendamento
      const availableDates = await this.simulateFetchAvailableDates();
      responseMessage = ChatbotFlows.schedule(availableDates).message;
      userConversation.state.awaitingConfirmation = true;
      userConversation.state.availableDates = availableDates;
    } else if (isSchedulingIntent) {
      if (userConversation.state.location && userConversation.state.selectedDate && userConversation.state.selectedTime) {
        responseMessage = this.generateConfirmationMessage(userConversation.state, ProfileName || userId);
        userConversation.state.appointmentConfirmed = true; // Marca o fluxo como finalizado
      } else {
        const availableDates = await this.simulateFetchAvailableDates();
        responseMessage = ChatbotFlows.schedule(availableDates).message;
        userConversation.state.awaitingConfirmation = true;
        userConversation.state.availableDates = availableDates;
      }
    } else if (isProvidingCity) {
      const location = getLocationInfo(Body.trim().toLowerCase());
      if (location) {
        userConversation.state.location = Body.trim().toLowerCase();
        userConversation.state.awaitingLocation = false;

        if (userConversation.state.selectedDate && userConversation.state.selectedTime) {
          responseMessage = this.generateConfirmationMessage(userConversation.state, ProfileName || userId);
          userConversation.state.appointmentConfirmed = true;
        } else {
          responseMessage = 'Agora, informe a data e o horário desejados para sua consulta.';
          userConversation.state.awaitingConfirmation = true;
        }
      } else {
        responseMessage = 'Não reconhecemos essa cidade. Por favor, informe uma cidade válida.';
      }
    } else if (isProvidingDateTime) {
      const result = await this.processSchedulingInputWithGPT(Body, userConversation.state.availableDates);

      if (result.complete) {
        userConversation.state.selectedDate = result.date;
        userConversation.state.selectedTime = result.time;

        if (!userConversation.state.location) {
          responseMessage = 'Por favor, informe a cidade para confirmarmos o agendamento.';
          userConversation.state.awaitingLocation = true;
        } else {
          responseMessage = this.generateConfirmationMessage(userConversation.state, ProfileName || userId);
          userConversation.state.appointmentConfirmed = true;
        }
      } else {
        responseMessage = 'Não consegui entender sua escolha de data e horário. Por favor, informe ambos de forma clara.';
      }
    } else {
      // Fallback: ChatGPT para respostas contextuais
      const history = userConversation.messages.join('\n');
      responseMessage = await this.openAiService.generateResponse(history);
    }

    userConversation.messages.push(`Bot: ${responseMessage}`);
    await this.twilioService.sendMessage(userId, responseMessage);

    return { response: responseMessage };
  }

  private async simulateFetchAvailableDates() {
    return [
      { date: '16/01 (terça-feira)', times: ['10:00', '14:00', '16:00'] },
      { date: '17/01 (quarta-feira)', times: ['09:00', '13:00', '15:00'] },
      { date: '18/01 (quinta-feira)', times: ['11:00', '14:30', '16:30'] },
    ];
  }

  private async processSchedulingInputWithGPT(input: string, availableDates: { date: string; times: string[] }[]) {
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



