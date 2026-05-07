import { IsNumber, IsInt, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionDto {
  @IsNumber()
  amount: number;

  @Type(() => Number)
  @IsInt()
  installments: number;

  @IsISO8601()
  requested_at: string;
}
