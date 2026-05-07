import { IsNumber, IsArray, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerDto {
  @IsNumber()
  avg_amount: number;

  @Type(() => Number)
  @IsInt()
  tx_count_24h: number;

  @IsArray()
  @IsString({ each: true })
  known_merchants: string[];
}
