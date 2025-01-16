import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ChatbotService } from './services/chatbot.service';
import { TwilioService } from './services/twilio.service';
import { OpenAiService } from './services/openai.service';
import { ChatbotController } from './controllers/chatbot.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, TwilioService, OpenAiService],
})
export class ChatbotModule {}
