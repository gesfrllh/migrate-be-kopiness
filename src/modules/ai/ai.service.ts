import { Injectable } from "@nestjs/common";
import Groq from "groq-sdk";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";

@Injectable()
export class AiService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async adjustCoffee(dto: CoffeeAssistantDto) {
    const prompt = `You are a world-class coffee expert with 15+ years of specialty coffee experience.

Analyze the user's brewing setup and provide extremely specific, actionable adjustments.

## USER'S CURRENT SETUP
- Brew Method: ${dto.method}
- Drink Type: ${dto.drinkType ?? 'not specified'}
- Roast Level: ${dto.roastLevel}
- Taste Preference: ${dto.tastePreference}
- Milk: ${dto.milkType ?? 'none'}
- Syrup: ${dto.syrupType ?? 'none'}
- Strength: ${dto.strength}
- Coffee-to-Water Ratio: 1:${dto.ratio}
- Iced: ${dto.ice ? 'Yes' : 'No'}
- Reported Problem: ${dto.problem}

## RESPONSE RULES
1. Return ONLY valid JSON — no markdown, no explanations, no code blocks.
2. Every adjustment must be specific (numbers, grams, seconds, temperatures).
3. Never give generic advice like "kurangi kopi" or "tambah air" — be precise.

## REQUIRED JSON FORMAT
{
  "analysis": "Brief 2-3 sentence diagnosis in Indonesian",
  "rootCause": "Single specific root cause in Indonesian",
  "adjustment": [
    "Specific adjustment 1 (e.g., Turunkan dosis kopi dari 18g ke 16g)",
    "Specific adjustment 2 (e.g., Giling lebih kasar ke setting 22 pada Comandante)",
    "Specific adjustment 3 (e.g., Kurangi suhu air dari 96°C ke 92°C)"
  ],
  "newRatio": "Specific ratio like 1:16.5",
  "grindSize": "Specific grind setting with reference (e.g., Setting 20 pada Comandante)",
  "temperature": "Exact temperature in °C (e.g., 92°C)",
  "milkAdjustment": "Specific milk advice or null if no milk",
  "confidence": number between 0-100
}`

    try {
      const response = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const rawText = response.choices[0]?.message?.content || '';

      const cleaned = rawText
        ?.replace(/```json/g, '')
        ?.replace(/```/g, '')
        ?.trim();

      const parsed = JSON.parse(cleaned || '{}');

      return parsed;
    } catch (err) {
      console.error(err);
      throw new Error('Adjustment failed');
    }
  }

}
