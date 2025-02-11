export class ChatbotRequestDto {
  From: string;
  Body: string;
  ProfileName: string;
  Contacts: {
    profile: {
      name: string;
    };
    wa_id: string;
  }[];
}
