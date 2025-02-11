import { getLocationInfo } from 'src/common/global-functions/cities';
import { EntenderDataHoraPrompt } from 'src/common/prompt/ouvirmais-promt';
import { OpenAiService } from 'src/chatbot/services/openai.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export async function simulateFetchAvailableDates() {
  return [
    { date: '16/01 (terça-feira)', times: ['10:00', '14:00', '16:00'] },
    { date: '17/01 (quarta-feira)', times: ['09:00', '13:00', '15:00'] },
    { date: '18/01 (quinta-feira)', times: ['11:00', '14:30', '16:30'] },
  ];
}

export async function processSchedulingInputWithGPT(
  input: string,
  availableDates: { date: string; times: string[] }[],
) {
  const gptPrompt = EntenderDataHoraPrompt(input, availableDates);

  const openAiService = new OpenAiService(
    new HttpService(),
    new ConfigService(),
  );
  const gptResponse = await openAiService.generateResponse(gptPrompt);

  try {
    return JSON.parse(gptResponse);
  } catch (error) {
    console.error('Erro ao processar a resposta do GPT:', error);
    return { complete: false };
  }
}

export function generateConfirmationMessage(state: any, name: string) {
  const location = getLocationInfo(state.location);
  return {
    message: `Confirmação de Consulta\n\nPaciente: ${name}\nData: ${state.selectedDate}\nHorário: ${state.selectedTime}\n\nEndereço: ${location?.address || 'Endereço não encontrado'}\nTelefone: ${location?.phone || 'Telefone não encontrado'}\n\nEstamos ansiosos para recebê-lo(a)!`,
  };
}
