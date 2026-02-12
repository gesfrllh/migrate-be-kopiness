import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CoffeAssistantService } from './coffe.service';
import { CoffeeAssistantDto } from './dto/coffe.dto';
import { CoffeeGuideDto } from './dto/coffe-response.dto';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CoffeeAssistantOptionsDto } from './dto/coffe-options.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';

@ApiTags('Coffee Assistant')
@Controller('coffee-assistant')
export class CoffeeAssistantController {
  constructor(private readonly coffeeService: CoffeAssistantService) { }

  @Post('generate')
  @UseGuards(JwtGuard)
  @ApiBody({ type: CoffeeAssistantDto })
  @ApiResponse({ status: 201, description: 'Coffee guide generated', type: CoffeeGuideDto })
  generate(@Body() dto: CoffeeAssistantDto): CoffeeGuideDto {
    const guide = this.coffeeService.generateCoffeGuide(dto);

    return {
      steps: guide.steps,
      ratio: guide.ratio,
      title: guide.title,
      description: guide.description,
      waterTemp: guide.waterTemp,
      grindSize: guide.grindSize,
      milkVolume: guide.milkVolume,
      milkTemp: guide.milkTemp,
      foamDensity: guide.foamDensity,
    };
  }

  @Get('options')
  @UseGuards(JwtGuard)
  @ApiResponse({
    status: 200,
    description: 'Coffee assistant dropdown options',
    type: CoffeeAssistantOptionsDto,
  })
  getOptions(): CoffeeAssistantOptionsDto {
    return this.coffeeService.getOptions();
  }
}
