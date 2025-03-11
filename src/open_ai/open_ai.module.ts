import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiService } from './services/openai.service';
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
