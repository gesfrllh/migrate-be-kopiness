import { Body, Controller, Post } from '@nestjs/common';
import { CoffeAssistantService } from './coffe.service';
import { CoffeeAssistantDto } from './dto/coffe.dto';
import { CoffeeGuideDto } from './dto/coffe-response.dto';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Coffee Assistant')
@Controller('coffee-assistant')
export class CoffeeAssistantController {
  constructor(private readonly coffeeService: CoffeAssistantService) { }

  @Post('generate')
  @ApiBody({ type: CoffeeAssistantDto })
  @ApiResponse({ status: 201, description: 'Coffee guide generated', type: CoffeeGuideDto })
  generate(@Body() dto: CoffeeAssistantDto): CoffeeGuideDto {
    const guide = this.coffeeService.generateCoffeGuide(dto);

    return {
      steps: guide.steps,
      ratio: guide.ratio,
      waterTemp: guide.waterTemp,
      grindSize: guide.grindSize,
      milkVolume: guide.milkVolume,
      milkTemp: guide.milkTemp,
      foamDensity: guide.foamDensity
    };
  }
}
