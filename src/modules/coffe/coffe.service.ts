import { Injectable } from "@nestjs/common";
import { CoffeeAssistantDto } from "./dto/coffe.dto";

export interface BrewStep {
  step: string,
  detail: string
}

export interface CoffeGuide {
  steps: BrewStep[],
  ratio?: number,
  waterTemp?: number,
  grindSize?: 'COARSE' | 'MEDIUM' | 'MEDIUM-FINE' | 'FINE',
  milkVolume?: number,
  milkTemp?: number,
  foamDensity?: 'THIN' | 'MEDIUM' | 'THICK';
}

@Injectable()
export class CoffeAssistantService {
  generateCoffeGuide(dto: CoffeeAssistantDto): CoffeGuide {
    const steps: BrewStep[] = []

    const ratioTable = { LIGHT: 16, MEDIUM: 15, DARK: 14 }
    let ratio = ratioTable[dto.roastLevel];

    if (dto.strength === 'STRONG') ratio -= 1;
    if (dto.strength === 'LIGHT') ratio += 1;

    let waterTemp = dto.drinkType === 'BREW' ? 93 : 90;
    let grindSize: 'COARSE' | 'MEDIUM' | 'MEDIUM-FINE' | 'FINE' = 'MEDIUM'

    if (['V60', 'CLEVER', 'KALITA'].includes(dto.drinkName)) {
      grindSize = 'MEDIUM-FINE';
      waterTemp = 93
    } else if (dto.drinkName === 'FRENCH_PRESS') {
      grindSize = 'COARSE';
      waterTemp = 92
    } else if (dto.drinkName === 'AEROPRESS') {
      grindSize = 'MEDIUM';
      waterTemp = 92;
    } else if (['ESPRESSO', 'LATTE', 'CAPPUCINO', 'MOCHA', 'FLAT_WHITE'].includes(dto.drinkName)) {
      grindSize = 'FINE';
      waterTemp = 93;
    }

    if (dto.drinkType === 'BREW') {
      steps.push({
        step: 'Brew Coffe',
        detail: `Use ${dto.dose}g coffe, grind ${grindSize}, ratio: 1:${ratio}, water temp ${waterTemp}°C`
      });
      steps.push({ step: 'Brew Time', detail: '3-4 Minutes depending on method' })
    } else {
      steps.push({
        step: 'Prepare Espresso',
        detail: `Use ${dto.dose}g coffe, grind ${grindSize}, ratio: 1:${ratio}, water temp ${waterTemp}°C, brew 25-30s`
      })
    }

    let milkVolume: number | undefined;
    let milkTemp: number | undefined;
    let foamDensity: 'THIN' | 'MEDIUM' | 'THICK' | undefined;

    if (dto.drinkType === 'MILK' || dto.ice) {
      milkVolume = dto.drinkType === 'MILK' ? 150 : 100;
      milkTemp = 58;
      foamDensity = 'THIN'
      steps.push({
        step: 'Steam milk',
        detail: `Steam ${milkVolume}ml ${dto.milkType || 'WHOLE'} milk to ${milkTemp}°C with ${foamDensity} foam`
      });
    }

    if (dto.syrupType) {
      steps.push({
        step: 'Add syrup',
        detail: `Add ${dto.syrupType} syrup to taste`
      });
    }

    if (dto.ice) {
      steps.push({
        step: 'Add ice',
        detail: 'Add ice cubes or crushed ice to serving'
      });
    }

    steps.push({
      step: 'Serve',
      detail: 'Pour into cup and enjoy your coffee!'
    });

    return {
      steps,
      ratio,
      waterTemp,
      grindSize,
      milkTemp,
      milkVolume,
      foamDensity
    }
  }
}