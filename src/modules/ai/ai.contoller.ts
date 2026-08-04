import { Body, Controller, Post, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";

@ApiTags('AI')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) { }

  @Post('coffe-assistant')
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
      const message = err instanceof Error ? err.message : 'AI provider request failed';
      this.logger.error(message);
      throw new HttpException({
        success: false,
        message,
      },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
