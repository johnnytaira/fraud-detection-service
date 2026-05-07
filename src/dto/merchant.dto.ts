import { IsNumber, IsString } from 'class-validator';

export class MerchantDto {
  @IsString()
  id: string;

  @IsString()
  mcc: string;

  @IsNumber()
  avg_amount: number;
}
