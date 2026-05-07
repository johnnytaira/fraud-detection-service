import { IsObject, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionDto } from './transaction.dto';
import { CustomerDto } from './customer.dto';
import { MerchantDto } from './merchant.dto';
import { TerminalDto } from './terminal.dto';
import { LastTransactionDto } from './last-transaction.dto';

export class FraudScoreRequestDto {
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => TransactionDto)
  transaction: TransactionDto;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ValidateNested()
  @Type(() => MerchantDto)
  merchant: MerchantDto;

  @ValidateNested()
  @Type(() => TerminalDto)
  terminal: TerminalDto;

  @ValidateIf((o) => o.last_transaction !== null)
  @ValidateNested()
  @Type(() => LastTransactionDto)
  last_transaction: LastTransactionDto | null;
}
