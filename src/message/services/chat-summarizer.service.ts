import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OpenRouterClientService } from './openrouter-client.service';

interface ChatMessage {
  sender: string;
  message: string;
}

interface SummaryResult {
  summary: string;
  key_points: string[];
}

@Injectable()
export class ChatSummarizerService {
  constructor(private readonly openRouterClient: OpenRouterClientService) {}

  async summarize(messages: ChatMessage[]): Promise<SummaryResult> {
    if (!messages || messages.length === 0) {
      throw new HttpException(
        'No messages to summarize',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.sender || !msg.message) {
        throw new HttpException(
          "Each message must have 'sender' and 'message' fields",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Format messages for prompt
    const chatText = messages
      .map((msg) => `[${msg.sender}] ${msg.message}`)
      .join('\n');

    const prompt = `You are a helpful assistant that summarizes chat conversations.

Please summarize the following chat messages and respond with ONLY a JSON object in this exact format (no markdown, no code blocks):

{"summary": "A brief 1-2 sentence summary of the conversation", "key_points": ["first key point", "second key point", "third key point"]}

Chat messages:
${chatText}

Remember: Respond with ONLY the JSON object, nothing else.`;

    // Call LLM
    const response = await this.openRouterClient.chatCompletion([
      { role: 'user', content: prompt },
    ]);

    // Parse JSON response
    try {
      let cleanedResponse = response;

      // Try to extract JSON if wrapped in markdown
      if (response.includes('```json')) {
        cleanedResponse = response.split('```json')[1].split('```')[0].trim();
      } else if (response.includes('```')) {
        cleanedResponse = response.split('```')[1].split('```')[0].trim();
      }

      const result = JSON.parse(cleanedResponse);

      // Validate structure
      if (!result.summary || !result.key_points) {
        throw new Error('Invalid response structure');
      }

      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to parse LLM response: ${error.message}\nResponse: ${response}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
