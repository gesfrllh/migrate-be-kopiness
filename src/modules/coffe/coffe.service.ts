import { Injectable } from "@nestjs/common";
import { CoffeeAssistantDto } from "./dto/coffe.dto";
import { enumToOptions } from "src/utils/options.utils";
import {
  RoastLevel,
  Strength,
  DrinkType,
  DrinkName,
  MilkType,
  SyrupType,
} from "src/common/types";
import { CoffeeAssistantOptionsDto } from "./dto/coffe-options.dto";

export interface BrewStep {
  step: string;
  detail: string;
}

export interface ProblemContext {
  key: string;
  label: string;
  description: string;
  severity: "RENDAH" | "SEDANG" | "TINGGI";
}

export interface CoffeGuide {
  title: string;
  description: string;
  steps: BrewStep[];
  ratio?: number;
  waterTemp?: number;
  grindSize?: "COARSE" | "MEDIUM" | "MEDIUM-FINE" | "FINE";
  milkVolume?: number;
  milkTemp?: number;
  foamDensity?: "THIN" | "MEDIUM" | "THICK";
  potentialProblems?: ProblemContext[];
}

@Injectable()
export class CoffeAssistantService {
  /* ===============================
     MAIN GENERATOR
  =============================== */

  generateCoffeGuide(dto: CoffeeAssistantDto): CoffeGuide {
    const steps: BrewStep[] = [];

    const dose = this.calculateDose(dto);
    const ratio = this.calculateRatio(dto);
    const { grindSize, waterTemp } = this.resolveBrewProfile(dto);

    const title = this.generateTitle(dto);
    const description = this.generateDescription(dto);

    /* ===== BREW / ESPRESSO ===== */

    if (dto.drinkType === "BREW") {
      steps.push({
        step: "Brew Coffee",
        detail: `Use ${dose}g coffee, grind ${grindSize}, ratio 1:${ratio}, water temp ${waterTemp}°C`,
      });

      steps.push({
        step: "Brew Time",
        detail: "3–4 minutes depending on method",
      });
    } else {
      steps.push({
        step: "Prepare Espresso",
        detail: `Use ${dose}g coffee, grind ${grindSize}, ratio 1:${ratio}, water temp ${waterTemp}°C, brew 25–30s`,
      });
    }

    /* ===== MILK PROFILE ===== */

    const isMilkDrink = this.isMilkDrink(dto.drinkName);

    let milkVolume: number | undefined;
    let milkTemp: number | undefined;
    let foamDensity: "THIN" | "MEDIUM" | "THICK" | undefined;

    if (isMilkDrink) {
      milkVolume = this.resolveMilkVolume(dto.drinkName);
      milkTemp = 58;
      foamDensity = this.resolveFoamDensity(dto.drinkName);

      steps.push({
        step: "Steam Milk",
        detail: `Steam ${milkVolume}ml ${dto.milkType || "WHOLE"} milk to ${milkTemp}°C with ${foamDensity} foam`,
      });
    }

    /* ===== SYRUP ===== */

    if (dto.syrupType) {
      steps.push({
        step: "Add Syrup",
        detail: `Add ${dto.syrupType} syrup to taste`,
      });
    }

    /* ===== ICE ===== */

    if (dto.ice) {
      steps.push({
        step: "Add Ice",
        detail: "Add ice cubes or crushed ice to serving",
      });
    }

    /* ===== SERVE ===== */

    steps.push({
      step: "Serve",
      detail: "Pour into cup and enjoy your coffee!",
    });

    const potentialProblems = this.generateProblemContexts(dto, { ratio, waterTemp, grindSize });

    return {
      title,
      description,
      steps,
      ratio,
      waterTemp,
      grindSize,
      milkVolume,
      milkTemp,
      foamDensity,
      potentialProblems,
    };
  }

  /* ===============================
     PROBLEM CONTEXT GENERATOR
  =============================== */

  private generateProblemContexts(
    dto: CoffeeAssistantDto,
    profile: { ratio: number; waterTemp: number; grindSize: string },
  ): ProblemContext[] {
    const problems: ProblemContext[] = [];

    // Roast-based problems
    if (dto.roastLevel === "LIGHT") {
      problems.push({
        key: "TERLALU_ASAM",
        label: "Terlalu Asam",
        description: `Light roast butuh suhu tinggi (${profile.waterTemp + 1}–96°C) dan ekstraksi lebih lama. Jika under-extracted, rasa asam/sour akan dominan.`,
        severity: "TINGGI",
      });
      problems.push({
        key: "KURANG_MANIS",
        label: "Kurang Manis",
        description: "Light roast punya potensi sweetness tinggi tapi sulit diekstrak. Pastikan suhu cukup tinggi dan contact time optimal.",
        severity: "SEDANG",
      });
    } else if (dto.roastLevel === "DARK") {
      problems.push({
        key: "TERLALU_PAHIT",
        label: "Terlalu Pahit",
        description: `Dark roast mudah over-extracted. Turunkan suhu ke ${profile.waterTemp - 2}–${profile.waterTemp}°C dan perpendek contact time.`,
        severity: "TINGGI",
      });
      problems.push({
        key: "AFTERTASTE_BURUK",
        label: "Aftertaste Buruk",
        description: "Dark roast rawan menghasilkan rasa burnt/ashy jika over-extracted atau suhu terlalu tinggi.",
        severity: "SEDANG",
      });
    }

    // Ratio-based problems
    if (profile.ratio > 16) {
      problems.push({
        key: "TERLALU_LEMAH",
        label: "Terlalu Lemah",
        description: `Rasio 1:${profile.ratio} cukup tinggi. Kopi berisiko watery/thin. Pertimbangkan turunkan ke 1:${profile.ratio - 1} atau perhalus grind.`,
        severity: profile.ratio > 17 ? "TINGGI" : "SEDANG",
      });
    } else if (profile.ratio < 14) {
      problems.push({
        key: "TERLALU_KUAT",
        label: "Terlalu Kuat",
        description: `Rasio 1:${profile.ratio} cukup rendah. Kopi berisiko terlalu pekat/intense. Bisa naikkan ke 1:${profile.ratio + 1} jika perlu.`,
        severity: profile.ratio < 13 ? "TINGGI" : "SEDANG",
      });
    }

    // Method-based problems
    if (dto.drinkName === "ESPRESSO" || dto.drinkType === "MILK") {
      problems.push({
        key: "KURANG_BODY",
        label: "Kurang Body",
        description: `Espresso dengan ${dto.roastLevel.toLowerCase()} roast butuh grind yang tepat. Jika body kurang, perhalus grind atau naikkan dose.`,
        severity: "SEDANG",
      });
    }

    if (dto.drinkName === "V60" || dto.drinkName === "KALITA") {
      problems.push({
        key: "TERLALU_FLAT",
        label: "Terlalu Flat",
        description: "Pour-over rawan flat extraction jika pouring tidak konsisten. Pastikan circular pour dengan flow rate stabil.",
        severity: "SEDANG",
      });
    }

    // Milk-based problems
    if (dto.milkType) {
      problems.push({
        key: "KURANG_MANIS",
        label: "Kurang Manis",
        description: `Susu ${dto.milkType.toLowerCase()} bisa meredam sweetness kopi. Sesuaikan ratio kopi:susu atau pilih milk-alternative yang lebih sweet.`,
        severity: "RENDAH",
      });
    }

    // Ice-based problems
    if (dto.ice) {
      problems.push({
        key: "TERLALU_LEMAH",
        label: "Terlalu Lemah (Dilusi)",
        description: "Es menyebabkan dilusi. Kompensasi dengan rasio lebih kuat (1:12–1:13) atau brew langsung ke es (Japanese iced).",
        severity: "TINGGI",
      });
    }

    return problems;
  }

  /* ===============================
     TITLE & DESCRIPTION
  =============================== */

  private generateTitle(dto: CoffeeAssistantDto): string {
    const iceLabel = dto.ice ? "Iced" : "Hot";

    const nameMap: Record<string, string> = {
      FRENCH_PRESS: "French Press",
      AEROPRESS: "AeroPress",
      V60: "V60",
      KALITA: "Kalita",
      CLEVER: "Clever Dripper",
      ESPRESSO: "Espresso",
      LATTE: "Latte",
      CAPPUCCINO: "Cappuccino",
      MOCHA: "Mocha",
      FLAT_WHITE: "Flat White",
    };

    const drinkName = nameMap[dto.drinkName] || dto.drinkName;

    return `${iceLabel} ${drinkName}`;
  }

  private generateDescription(dto: CoffeeAssistantDto): string {
    return `A ${dto.strength.toLowerCase()} strength ${dto.roastLevel.toLowerCase()} roast coffee prepared in ${dto.drinkType.toLowerCase()} style.`;
  }

  /* ===============================
     CALCULATORS
  =============================== */

  private calculateDose(dto: CoffeeAssistantDto): number {
    if (dto.drinkType === "BREW") {
      switch (dto.drinkName) {
        case "FRENCH_PRESS":
          return 18;
        case "AEROPRESS":
          return 16;
        case "V60":
        case "KALITA":
        case "CLEVER":
        default:
          return 15;
      }
    }

    return 18; // espresso based
  }

  private calculateRatio(dto: CoffeeAssistantDto): number {
    const ratioTable = {
      LIGHT: 16,
      MEDIUM: 15,
      DARK: 14,
    };

    let ratio = ratioTable[dto.roastLevel];

    if (dto.strength === "STRONG") ratio -= 1;
    if (dto.strength === "LIGHT") ratio += 1;

    return ratio;
  }

  private resolveBrewProfile(dto: CoffeeAssistantDto): {
    grindSize: "COARSE" | "MEDIUM" | "MEDIUM-FINE" | "FINE";
    waterTemp: number;
  } {
    switch (dto.drinkName) {
      case "FRENCH_PRESS":
        return { grindSize: "COARSE", waterTemp: 92 };

      case "AEROPRESS":
        return { grindSize: "MEDIUM", waterTemp: 92 };

      case "V60":
      case "CLEVER":
      case "KALITA":
        return { grindSize: "MEDIUM-FINE", waterTemp: 93 };

      case "ESPRESSO":
      case "LATTE":
      case "CAPPUCCINO":
      case "MOCHA":
      case "FLAT_WHITE":
        return { grindSize: "FINE", waterTemp: 93 };

      default:
        return { grindSize: "MEDIUM", waterTemp: 93 };
    }
  }

  /* ===============================
     MILK PROFILE
  =============================== */

  private isMilkDrink(drinkName: string): boolean {
    return ["LATTE", "CAPPUCCINO", "MOCHA", "FLAT_WHITE"].includes(drinkName);
  }

  private resolveMilkVolume(drinkName: string): number {
    switch (drinkName) {
      case "CAPPUCCINO":
        return 120;
      case "FLAT_WHITE":
        return 130;
      case "MOCHA":
        return 140;
      case "LATTE":
      default:
        return 150;
    }
  }

  private resolveFoamDensity(
    drinkName: string
  ): "THIN" | "MEDIUM" | "THICK" {
    switch (drinkName) {
      case "CAPPUCCINO":
        return "THICK";
      case "FLAT_WHITE":
      case "MOCHA":
        return "MEDIUM";
      case "LATTE":
      default:
        return "THIN";
    }
  }

  /* ===============================
     OPTIONS
  =============================== */

  getOptions(): CoffeeAssistantOptionsDto {
    return {
      roastLevels: enumToOptions(RoastLevel),
      strength: enumToOptions(Strength),
      drinkNames: enumToOptions(DrinkName),
      drinkTypes: enumToOptions(DrinkType),
      milkTypes: enumToOptions(MilkType),
      syrupTypes: enumToOptions(SyrupType),
    };
  }
}
