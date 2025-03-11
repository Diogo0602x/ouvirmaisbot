import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiModule } from '../open_ai/open_ai.module';
import { WhatsappBotController } from './controllers/whatsapp_bot.controller';
import { WhatsappService } from './services/whatsapp.service';
import { WhatsappBotService } from './services/whatsapp_bot.service';

@Module({
  imports: [HttpModule, ConfigModule, OpenAiModule],
  controllers: [WhatsappBotController],
  providers: [WhatsappBotService, WhatsappService],
})
export class WhatsappBotModule {}
