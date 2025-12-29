import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import axios from 'axios';

interface ChatMessage {
  role: string;
  content: string;
}

@Injectable()
export class OpenRouterClientService {
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private readonly configService: AiConfigService) {}

  async chatCompletion(
    messages: ChatMessage[],
    temperature?: number,
    maxTokens?: number,
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${this.configService.getApiKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Chat Summarizer',
    };

    const payload = {
      model: this.configService.getModelId(),
      messages,
      temperature: temperature ?? this.configService.getTemperature(),
      max_tokens: maxTokens ?? this.configService.getMaxTokens(),
    };

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        console.log(`🚀 Sending request to OpenRouter (attempt ${attempt + 1})...`);

        const response = await axios.post(this.apiUrl, payload, {
          headers,
          timeout: 30000,
        });

        console.log(`✅ OpenRouter Response status: ${response.status}`);

        if (response.status === 200) {
          // 👉 FIX: typage sûr
          const data = response.data as any;

          console.log("📩 Full API Response:", JSON.stringify(data, null, 2));

          const content = data.choices?.[0]?.message?.content;

          if (!content || !content.trim()) {
            throw new HttpException(
              `API returned empty content. Full response: ${JSON.stringify(data, null, 2)}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          return content;
        }
      } catch (error) {
        const errAny = error as any;

        console.error(`❌ Request attempt ${attempt + 1} failed:`, errAny.message);

        if (errAny?.isAxiosError) {
          const resp = errAny.response;

          console.error("🔥 FULL ERROR DATA:", JSON.stringify(resp?.data, null, 2));
          console.error("🔥 Status Code:", resp?.status);
          console.error("🔥 Headers:", resp?.headers);

          if (resp?.status >= 500 && attempt < 3) {
            console.log(`⚠️ Server error ${resp.status}, retrying in ${2 ** attempt}s...`);
            await this.sleep(1000 * (2 ** attempt));
            continue;
          }

          throw new HttpException(
            `OpenRouter API error ${resp?.status}: ${JSON.stringify(resp?.data)}`,
            resp?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        if (attempt < 3) {
          await this.sleep(1000 * (2 ** attempt));
          continue;
        }

        throw new HttpException(
          `Request failed: ${errAny.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    throw new HttpException('Max retries exceeded', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
