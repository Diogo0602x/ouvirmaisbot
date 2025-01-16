import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../../src/chatbot/services/chatbot.service';
import { TwilioService } from '../../src/chatbot/services/twilio.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  const mockTwilioService = {
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: TwilioService, useValue: mockTwilioService },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('should send a welcome message', async () => {
    const mockRequest = { From: 'whatsapp:+123456789', Body: 'Hello', ProfileName: 'John' };
    const response = await service.handleMessage(mockRequest);
    expect(response.message).toContain('Olá senhor(a) John');
    expect(mockTwilioService.sendMessage).toHaveBeenCalledWith(
      '+123456789',
      expect.any(String),
    );
  });
});
