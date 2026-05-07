import { IsISO8601, IsNumber } from 'class-validator';

export class LastTransactionDto {
  @IsISO8601()
  timestamp: string;

  @IsNumber()
  km_from_current: number;
}
