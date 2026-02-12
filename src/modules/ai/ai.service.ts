import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";

@Injectable()
export class AiService {
  private ai = new GoogleGenAI({
    apiKey: process.env.GOOGLEAI_KEY
  });

  async adjustCoffee(dto: CoffeeAssistantDto) {
    const prompt = `
Kamu adalah barista profesional dengan pengalaman 10+ tahun.
Analisa hasil seduhan user dan berikan perbaikan yang presisi.

Kondisi saat ini:

Minuman: ${dto.method}
Tipe: ${dto.drinkType ?? 'tidak disebutkan'}
Roast Level: ${dto.roastLevel}
Strength Preference: ${dto.tastePreference}
Milk: ${dto.milkType ?? 'tanpa susu'}
Syrup: ${dto.syrupType ?? 'tanpa syrup'}
strength: ${dto.strength}
ratio: 1:${dto.ratio} 
Iced: ${dto.ice ? 'Ya (menggunakan es)' : 'Tidak'}
Problem yang dirasakan: ${dto.problem}

Jika minuman berbasis susu, pertimbangkan juga:
- suhu susu
- tekstur foam
- keseimbangan kopi dan susu

Jika iced, pertimbangkan efek dilution dari es.

Berikan jawaban HANYA dalam format JSON valid berikut:

{
  "analysis": string,
  "rootCause": string,
  "adjustment": string[],
  "newRatio": string,
  "grindSize": string,
  "temperature": string,
  "milkAdjustment": string | null,
  "confidence": number (0-100)
}

Rules:
- Jangan beri penjelasan di luar JSON.
- Jangan gunakan markdown.
- Jawaban harus valid JSON.
`


    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const rawText = response.text;

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