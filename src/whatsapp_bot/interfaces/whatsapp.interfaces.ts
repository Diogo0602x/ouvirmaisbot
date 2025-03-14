export interface ConversationState {
  name: string;
  location: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  appointmentConfirmed: boolean;
  awaitingConfirmation: boolean;
  awaitingLocation: boolean;
  availableDates?: Array<{ date: string; times: string[] }>;
}

export interface ConversationData {
  messages: string[];
  state: ConversationState;
}

export interface WhatsAppMessagePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'template';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
  };
}

export const ChatbotFlows = {
  welcome: (name: string) => ({
    message: `Olá senhor(a) ${name}, tudo bem?\n\nSeja bem-vindo(a) à Ouvir Mais Aparelhos Auditivos. Em que posso lhe ajudar?`,
  }),
  prices: {
    message: `Infelizmente, não posso fornecer valores diretamente por aqui. Podemos agendar uma consulta gratuita para você conhecer melhor nossas opções?`,
  },
  schedule: (dates: { date: string; times: string[] }[]) => ({
    message: `Temos os seguintes horários disponíveis:\n${dates
      .map((d) => `${d.date}: ${d.times.join(', ')}`)
      .join('\n')}\n\nPor favor, escolha um horário para agendarmos.`,
  }),
  confirmSchedule: (details: {
    name: string;
    date: string;
    time: string;
    address: string;
    phone: string;
  }) => ({
    message: `Confirmação de Consulta\n\nPaciente: ${details.name}\nData: ${details.date}\nHorário: ${details.time}\n\nEndereço: ${details.address}\nTelefone: ${details.phone}\n\nEstamos ansiosos para recebê-lo(a)!`,
  }),
};
