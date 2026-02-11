import { Body, Controller, Post, HttpException, HttpStatus } from "@nestjs/common";
import { AiService } from "./ai.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CoffeeAssistantDto } from "./dto/coffe-assitant.dto";

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('coffe-assistant')
  @ApiOperation({ summary: 'Generate Coffe Brew Guide using AI' })
  @ApiResponse({
    status: 200,
    description: 'Coffe guide generated successfully'
  })
  async coffeAssistant(@Body() dto: CoffeeAssistantDto) {
    try {
      const result = await this.aiService.generateCoffeGuide(dto);

      return {
        success: true,
        data: result
      }
    } catch (err) {
      throw new HttpException({
        success: false,
        message: 'Coffe assistant failed.'
      },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
