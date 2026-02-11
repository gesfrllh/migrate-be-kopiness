import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";

@Injectable()
export class AiService {
  private ai = new GoogleGenAI({
    apiKey: process.env.GOOGLEAI_KEY
  });

  async generateCoffeGuide(dto: CoffeeAssistantDto) {
    const prompt = `
                  Kamu adalah barista profesional.

                  Buat brew guide dalam JSON:

                  {
                    "coffeeDose": number,
                    "waterAmount": number,
                    "ratio": string,
                    "temperature": string,
                    "steps": string[],
                    "tips": string[],
                    "adjustment": string[]
                  }

                  Data:
                  Metode: ${dto.method}
                  Roast: ${dto.roastLevel}
                  Preferensi rasa: ${dto.tastePreference}
                  Problem: ${dto.problem ?? 'tidak ada'}
                  Experience: ${dto.experienceLevel ?? 'tidak disebutkan'}

                  Jawab hanya JSON valid.
                  `;
    try {

      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });

      return response.text
    } catch (err) {
      console.error(err)
      throw new Error('Coffe assitant failed')
    }
  }
}