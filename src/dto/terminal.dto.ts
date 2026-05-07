import { IsBoolean, IsNumber } from 'class-validator';

export class TerminalDto {
  @IsBoolean()
  is_online: boolean;

  @IsBoolean()
  card_present: boolean;

  @IsNumber()
  km_from_home: number;
}
