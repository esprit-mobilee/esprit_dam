import { Module } from '@nestjs/common';
import { GradioClientService } from './gradio/gradio.client';
import { GradioSummarizeController } from './gradio/summarize.controller';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [MessageModule],
  providers: [GradioClientService],
  controllers: [GradioSummarizeController],
  exports: [GradioClientService],
})
export class IntegrationsModule {}
