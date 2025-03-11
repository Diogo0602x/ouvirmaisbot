import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiModule } from './open_ai/open_ai.module';
import { WhatsappBotModule } from './whatsapp_bot/whatsapp_bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OpenAiModule,
    WhatsappBotModule,
  ],
})
export class AppModule {}
