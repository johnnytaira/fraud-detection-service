import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';

@Module({
  imports: [],
  controllers: [AppController, FraudController],
  providers: [AppService, FraudService],
})
export class AppModule {}
