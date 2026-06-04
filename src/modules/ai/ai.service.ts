import { Injectable } from "@nestjs/common";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";

@Injectable()
export class AiService {
  private ai: any = null;

  async adjustCoffee(dto: CoffeeAssistantDto) {

    if (!this.ai) {
      const { GoogleGenAI } = await import("@google/genai");
      this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLEAI_KEY });
    }
    const PROBLEM_CONTEXT: Record<string, string> = {
      TERLALU_ASAM: "Kopi terasa terlalu asam/sour — kemungkinan under-extracted, suhu terlalu rendah, grind terlalu kasar, atau rasio air kurang",
      TERLALU_PAHIT: "Kopi terasa terlalu pahit/harsh — kemungkinan over-extracted, suhu terlalu tinggi, grind terlalu halus, atau contact time terlalu lama",
      TERLALU_LEMAH: "Kopi terasa watery/thin — kemungkinan rasio kopi terlalu sedikit, grind terlalu kasar, atau under-extracted",
      TERLALU_KUAT: "Kopi terasa terlalu pekat/intense — kemungkinan rasio kopi terlalu banyak atau over-extracted",
      KURANG_BODY: "Kopi terasa encer dan kurang mouthfeel — kemungkinan grind terlalu kasar atau metode brew kurang optimal",
      TERLALU_FLAT: "Kopi terasa flat/hambar tanpa complexity — kemungkinan kopi stale, under-extracted, atau air kurang berkualitas",
      AFTERTASTE_BURUK: "Kopi meninggalkan rasa tidak enak di akhir — kemungkinan channeling, grind tidak konsisten, atau over-extracted",
      KURANG_MANIS: "Kopi kurang sweetness alami — kemungkinan under-extracted atau roast level tidak sesuai preferensi",
    };

    const METHOD_DEFAULTS: Record<string, {
      tempRange: string;
      contactTime: string;
      grindRange: string;
      notes: string;
    }> = {
      CLEVER: {
        tempRange: "88–96°C",
        contactTime: "3–4 menit steep + 1–2 menit drain",
        grindRange: "Medium (mirip French Press tapi sedikit lebih halus)",
        notes: "Full immersion — contact time sangat mempengaruhi ekstraksi. Grind size dan suhu adalah variabel utama.",
      },
      V60: {
        tempRange: "90–96°C",
        contactTime: "2:30–3:30 menit total",
        grindRange: "Medium-fine",
        notes: "Pour-over — teknik pouring dan grind size sangat krusial.",
      },
      FRENCH_PRESS: {
        tempRange: "90–94°C",
        contactTime: "4 menit",
        grindRange: "Coarse",
        notes: "Full immersion — grind coarse untuk hindari over-extraction.",
      },
      AEROPRESS: {
        tempRange: "80–96°C",
        contactTime: "1–2 menit",
        grindRange: "Fine-medium",
        notes: "Versatile — pressure dan steep time mempengaruhi hasil.",
      },
      ESPRESSO: {
        tempRange: "90–94°C",
        contactTime: "25–30 detik",
        grindRange: "Fine",
        notes: "Pressure 9 bar — grind size adalah variabel paling kritis.",
      },
      MOKA_POT: {
        tempRange: "Air panas ~90°C saat dimasukkan",
        contactTime: "4–5 menit di kompor api kecil",
        grindRange: "Fine-medium (lebih kasar dari espresso)",
        notes: "Preheat air sebelum dimasukkan untuk hindari bitter.",
      },
      COLD_BREW: {
        tempRange: "Suhu ruang atau kulkas (4–20°C)",
        contactTime: "12–24 jam",
        grindRange: "Very coarse",
        notes: "Waktu adalah variabel utama. Semakin lama = semakin strong.",
      },
      SYPHON: {
        tempRange: "92–96°C",
        contactTime: "1–1:30 menit di atas chamber",
        grindRange: "Medium",
        notes: "Kontrol api sangat penting untuk konsistensi suhu.",
      },
    };

    const ROAST_CONTEXT: Record<string, string> = {
      LIGHT: "Light roast cenderung lebih asam, fruity, floral. Butuh suhu lebih tinggi dan ekstraksi lebih lama untuk unlock sweetness-nya.",
      MEDIUM: "Medium roast balance antara acidity dan body. Relatif forgiving dalam ekstraksi.",
      DARK: "Dark roast cenderung lebih bitter, bold, low acidity. Butuh suhu lebih rendah dan waktu lebih singkat.",
    };

    const MILK_CONTEXT: Record<string, string> = {
      FULL_CREAM: "Full cream milk — fat tinggi, creamy, sedikit meredam acidity dan bitterness.",
      OATMILK: "Oat milk — slight sweetness, cocok untuk light/medium roast, bisa memperkuat body.",
      SKIMMILK: "Skim milk — rendah lemak, rasa lebih watery, kurang meredam intensity kopi.",
      ALMONDMILK: "Almond milk — nutty, thin body, sedikit meredam bitterness.",
      SOYMILK: "Soy milk — protein tinggi, body cukup baik, kadang clash dengan acidity tinggi.",
    };

    const prompt = `You are a world-class coffee expert and Q-Grader with 15+ years of specialty coffee experience, specializing in brew troubleshooting.

Your job is to diagnose the user's specific coffee problem and give hyper-specific, numbered, actionable adjustments — like a barista trainer standing next to them.

---

## USER'S BREWING PROFILE

| Parameter        | Value |
|-----------------|-------|
| Brew Method     | ${dto.method} |
| Drink Type      | ${dto.drinkType ?? "Black"} |
| Roast Level     | ${dto.roastLevel} |
| Taste Preference| ${dto.tastePreference} |
| Milk            | ${dto.milkType || "None"} |
| Syrup           | ${dto.syrupType || "None"} |
| Strength        | ${dto.strength} |
| Coffee:Water    | 1:${dto.ratio} |
| Iced            | ${dto.ice ? "Yes — adjust for ice dilution" : "No"} |

---

## REPORTED PROBLEM
**${dto.problem}** — ${dto.problem ? (PROBLEM_CONTEXT[dto.problem] ?? dto.problem) : 'Tidak ada problem yang dilaporkan'}

---

## METHOD-SPECIFIC CONTEXT
**${dto.method}:**
- Recommended temp range: ${METHOD_DEFAULTS[dto.method]?.tempRange ?? "85–96°C"}
- Typical contact time: ${METHOD_DEFAULTS[dto.method]?.contactTime ?? "varies"}
- Grind range: ${METHOD_DEFAULTS[dto.method]?.grindRange ?? "medium"}
- Key note: ${METHOD_DEFAULTS[dto.method]?.notes ?? "—"}

---

## ROAST CONTEXT
${ROAST_CONTEXT[dto.roastLevel] ?? ""}

${dto.milkType ? `## MILK CONTEXT\n${MILK_CONTEXT[dto.milkType] ?? `${dto.milkType} — adjust ratio to compensate for milk's flavor masking.`}` : ""}

${dto.ice ? `## ICE ADJUSTMENT NOTE\nKopi iced mengalami dilusi saat es mencair. Kompensasi dengan: rasio lebih kuat (kurangi 10–15% air), atau brew langsung ke es (Japanese iced method jika memungkinkan).` : ""}

---

## DIAGNOSIS INSTRUCTIONS
1. Identifikasi ROOT CAUSE paling spesifik berdasarkan kombinasi: problem + method + roast + ratio + milk
2. Berikan adjustment yang TERURUT dari yang paling impactful
3. Setiap adjustment HARUS menyertakan: nilai saat ini → nilai yang disarankan (contoh: "Naikkan suhu dari estimasi 88°C ke 93°C")
4. Grind size harus referensikan alat umum (Comandante, 1Zpresso, Timemore, atau deskripsi tekstur)
5. Jika ada susu, pertimbangkan efek milk terhadap persepsi rasa
6. Jika iced, pertimbangkan dilution factor

---

## STRICT OUTPUT RULES
- Return ONLY valid JSON — zero markdown, zero explanation, zero code fences
- All text values must be in Indonesian
- Numbers must be actual numbers (not strings)
- "adjustment" array: minimum 3, maximum 5 items — each must start with a verb (Naikkan, Turunkan, Giling, Perpanjang, dst)
- "milkAdjustment" must be null if no milk used
- "confidence" reflects how certain you are given the info provided (0–100)

---

## REQUIRED JSON FORMAT
{
  "analysis": "2–3 kalimat diagnosis spesifik berdasarkan setup dan problem pengguna",
  "rootCause": "1 kalimat — akar masalah paling dominan yang menyebabkan problem ini",
  "adjustment": [
    "Verb + parameter + nilai sekarang → nilai baru + alasan singkat",
    "Verb + parameter + nilai sekarang → nilai baru + alasan singkat",
    "Verb + parameter + nilai sekarang → nilai baru + alasan singkat"
  ],
  "newRatio": "Format 1:XX.X — sebutkan perubahan jika ada, atau pertahankan jika sudah optimal",
  "grindSize": "Deskripsi spesifik dengan referensi grinder atau tekstur (e.g., Setting 18 Comandante, atau tekstur pasir kasar)",
  "temperature": "Suhu eksak dalam °C disertai alasan (e.g., 94°C — light roast butuh suhu tinggi untuk unlock sweetness)",
  "milkAdjustment": "Saran spesifik terkait susu, atau null jika tidak pakai susu",
  "confidence": number 0–100
}`;



    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const rawText = response.text;

      const cleaned = rawText
        ?.replace(/```json/g, "")
        ?.replace(/```/g, "")
        ?.trim();

      const parsed = JSON.parse(cleaned || "{}");

      return parsed;
    } catch (err) {
      console.error(err);
      throw new Error("Adjustment failed");
    }
  }
}