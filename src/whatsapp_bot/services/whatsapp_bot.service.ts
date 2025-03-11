import { Injectable } from '@nestjs/common';
import { OpenAiService } from 'src/open_ai/services/openai.service';
import { getLocationInfo } from '../../common/global-functions/cities';
import {
  generateConfirmationMessage,
  processSchedulingInputWithGPT,
  simulateFetchAvailableDates,
} from '../../common/utils/chatbot.util';
import { formatPhoneNumber } from '../../common/utils/phone.util';
import { WhatsAppMessageDto } from '../dtos/whatsapp_message.dto';
import {
  ChatbotFlows,
  ConversationData,
} from '../interfaces/whatsapp.interfaces';
import { WhatsappService } from './whatsapp.service';
@Injectable()
export class WhatsappBotService {
  private conversations: Record<string, ConversationData> = {};

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly openAiService: OpenAiService,
  ) {}

  async handleMessage(request: WhatsAppMessageDto) {
    const userId = formatPhoneNumber(request.From);
    const userName =
      request.Contacts?.[0]?.profile?.name || request.ProfileName || userId;

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

    userConversation.messages.push(`User: ${request.Body}`);
    let responseMessage = '';

    const isGreeting = /oi|olá|bom dia|boa tarde|boa noite/i.test(request.Body);
    const isConfirmation = /sim|claro|com certeza|ok|sim, desejo/i.test(
      request.Body.toLowerCase(),
    );
    const isSchedulingIntent = /agendar|consulta|horário/i.test(
      request.Body.toLowerCase(),
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
        request.Body,
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
      const location = getLocationInfo(request.Body.trim().toLowerCase());
      if (location) {
        userConversation.state.location = request.Body.trim().toLowerCase();
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
