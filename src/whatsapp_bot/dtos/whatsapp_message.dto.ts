export class WhatsAppMessageDto {
  From: string;
  Body: string;
  ProfileName: string;
  MessageId?: string;
  Timestamp?: number;
  Contacts?: {
    profile: {
      name: string;
    };
    wa_id: string;
  }[];
}
