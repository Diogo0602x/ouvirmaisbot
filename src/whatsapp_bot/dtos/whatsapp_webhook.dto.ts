export class WhatsAppWebhookDto {
  object: string;
  entry?: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: number;
          text: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}
