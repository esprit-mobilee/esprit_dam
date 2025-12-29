import { Controller, Post, Body, Logger } from '@nestjs/common';
import { GradioClientService } from './gradio.client';
import { MessageService } from '../../message/message.service';

@Controller('integrations/gradio')
export class GradioSummarizeController {
  private readonly logger = new Logger(GradioSummarizeController.name);
  constructor(
    private readonly gradio: GradioClientService,
    private readonly messageService: MessageService,
  ) {}

  @Post('summarize-and-mark')
  async summarizeAndMark(@Body() body: { userId?: string; otherId?: string; messages?: any[] }) {
    const { userId, otherId, messages } = body;

    let convo: Array<{ sender: string; message: string }> = [];
    if (messages && Array.isArray(messages)) {
      convo = messages;
    } else if (userId && otherId) {
      const unseen = await this.messageService.getUnreadMessages(userId, otherId);
      convo = unseen.map(m => ({ sender: m.sender, message: m.message }));
    } else {
      throw new Error('Provide either messages array or userId+otherId');
    }

    if (!convo.length) {
      return { ok: true, summary: '', note: 'No unseen messages' };
    }

    const gradioOut = await this.gradio.summarizeChat(convo);

    if (userId && otherId) {
      await this.messageService.markMessagesAsRead(userId, otherId);
    }

    return { ok: true, gradioOut };
  }
}
