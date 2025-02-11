import { Injectable } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { OpenAiService } from './openai.service';
import { ChatbotFlows } from '../flows/chatbot.flows';
import { getLocationInfo } from 'src/common/global-functions/cities';
import { formatPhoneNumber } from 'src/common/utils/phone.util';
import {
  simulateFetchAvailableDates,
  processSchedulingInputWithGPT,
  generateConfirmationMessage,
} from 'src/common/utils/chatbot.util';

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
    Contacts,
  }: {
    From: string;
    Body: string;
    ProfileName?: string;
    Contacts?: any;
  }) {
    const userId = formatPhoneNumber(From);

    const userName = Contacts?.[0]?.profile?.name || ProfileName || userId;

    if (!this.conversations[userId]) {
      this.conversations[userId] = {
        messages: [],
        state: {
          name: userName,
          location: null,
          selectedDate: null,
          selectedTime: null,
          appointmentConfirmed: false,
          awaitingConfirmation: false,
          awaitingLocation: false,
        },
      };
    }

    const userConversation = this.conversations[userId];

    if (
      !userConversation.state.name ||
      userConversation.state.name === 'Usuário'
    ) {
      userConversation.state.name = userName;
    }

    console.log(
      '📩 Conversação Atualizada:',
      JSON.stringify(userConversation, null, 2),
    );

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
      responseMessage = ChatbotFlows.welcome(
        userConversation.state.name,
      ).message;
    } else if (isConfirmation || isSchedulingIntent) {
      const availableDates = await simulateFetchAvailableDates();
      responseMessage = ChatbotFlows.schedule(availableDates).message;
      userConversation.state.availableDates = availableDates;
      userConversation.state.awaitingConfirmation = true;
    } else if (userConversation.state.awaitingConfirmation) {
      const result = await processSchedulingInputWithGPT(
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
          responseMessage = generateConfirmationMessage(
            userConversation.state,
            userConversation.state.name,
          ).message;
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

        responseMessage = generateConfirmationMessage(
          userConversation.state,
          userConversation.state.name,
        ).message;
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
}
