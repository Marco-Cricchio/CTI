// server/src/indicators/indicators.module.ts
import { Module } from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { IndicatorsController } from './indicators.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Indicator } from './entities/indicator.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity'; // <-- AGGIUNGI QUESTO IMPORT

@Module({
  imports: [
    TypeOrmModule.forFeature([Indicator, User]), // <-- AGGIUNGI User QUI
    BullModule.registerQueue({
      name: 'enrichment-queue',
    }),
    AuthModule,
  ],
  controllers: [IndicatorsController],
  providers: [IndicatorsService],
})
export class IndicatorsModule {}
