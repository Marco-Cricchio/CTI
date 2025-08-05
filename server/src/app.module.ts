// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { AuthModule } from './auth.module'; // Importato una sola volta
import { IndicatorsModule } from './indicators/indicators.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    AuthModule, // Presente una sola volta
    IndicatorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
