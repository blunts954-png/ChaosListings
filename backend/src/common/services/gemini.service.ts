import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  get generativeModel() {
    return this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateContent(prompt: string) {
    const result = await this.generativeModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}
