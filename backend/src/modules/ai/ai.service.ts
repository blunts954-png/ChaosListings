import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { GeminiService } from '@/common/services/gemini.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  async generateSuggestions(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    const prompt = `
      You are an expert in local SEO and business listing optimization. 
      Analyze the following business data and provide suggestions for improvement.

      Business Data:
      - Name: ${business.name}
      - Address: ${business.address}
      - Website: ${business.website}
      - Phone: ${business.phone}

      Your task is to return a JSON array of suggestion objects.
      Each object should have the following structure:
      {
        "field": "The name of the business field to improve (e.g., 'Business Name', 'Website')",
        "currentValue": "The current value of the field",
        "suggestedValue": "Your suggested new value for the field",
        "reasoning": "A brief explanation of why you are suggesting this change."
      }

      Provide up to 3 suggestions. If a field is already well-optimized, you don't need to provide a suggestion for it.
      Return only the JSON array, with no other text or explanation.
    `;

    try {
      const responseText = await this.geminiService.generateContent(prompt);
      // Clean the response to ensure it's valid JSON
      const jsonResponse = responseText.replace(/```json/g, '').replace(/```/g, '');
      const suggestions = JSON.parse(jsonResponse);
      return suggestions;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // You might want to throw a more specific error here
      throw new Error('Failed to get suggestions from AI.');
    }
  }
}
