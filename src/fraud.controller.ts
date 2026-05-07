import { Body, Controller, Post } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudScoreRequestDto } from 'src/dto/fraud-score-request.dto';
import { FraudScoreResponseDto } from 'src/dto/fraud-score-response.dto';

@Controller()
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post('/fraud-score')
  async getFraudScore(
    @Body() request: FraudScoreRequestDto,
  ): Promise<FraudScoreResponseDto> {
    return this.fraudService.evaluate(request);
  }
}
