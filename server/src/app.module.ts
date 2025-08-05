// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module'; // Importato una sola volta
import { IndicatorsModule } from './indicators/indicators.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    AuthModule, // Presente una sola volta
    IndicatorsModule,
    EnrichmentModule,
    TagsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
