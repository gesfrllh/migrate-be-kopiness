import { Body, Controller, HttpException, HttpStatus, Logger, Post, UseGuards } from "@nestjs/common";
import { Throttle } from '@nestjs/throttler';
import { AiService } from "./ai.service";
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";
import { JwtGuard } from '../../common/guards/jwt.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) { }

  @Post('coffe-assistant')
  @UseGuards(JwtGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Coffe Brew Guide using AI' })
  @ApiResponse({
    status: 200,
    description: 'Coffe guide generated successfully'
  })
  async coffeAssistant(@Body() dto: CoffeeAssistantDto) {
    try {
      const result = await this.aiService.adjustCoffee(dto);

      return {
        success: true,
        data: result
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const message = err instanceof Error ? err.message : 'AI provider request failed';
      this.logger.error(message);
      throw new HttpException({
        success: false,
        message: 'AI provider request failed',
      },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
