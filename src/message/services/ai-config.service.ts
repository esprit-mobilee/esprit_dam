import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfigService {
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor() {
    // Load from .env
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.modelId = process.env.MODEL_ID || 'mistralai/mistral-7b-instruct:free';

    // Optional: overrideable from .env
    this.maxTokens = Number(process.env.MAX_TOKENS) || 2048;
    this.temperature = Number(process.env.TEMPERATURE) || 0.4;
  }

  /** Return API Key or throw. */
  getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('❌ OPENROUTER_API_KEY is missing in environment variables');
    }
    return this.apiKey;
  }

  /** Return the selected model */
  getModelId(): string {
    return this.modelId;
  }

  /** Return max tokens for LLM */
  getMaxTokens(): number {
    return this.maxTokens;
  }

  /** Return sampling temperature */
  getTemperature(): number {
    return this.temperature;
  }
}
