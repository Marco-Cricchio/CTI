// server/src/indicators/indicators.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Query, ValidationPipe } from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { QueryIndicatorDto } from './dto/query-indicator.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('indicators')
@UseGuards(AuthGuard('jwt'))
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Post()
  create(@Body() createIndicatorDto: CreateIndicatorDto, @GetUser() user: User) {
    return this.indicatorsService.create(createIndicatorDto, user);
  }

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) queryDto: QueryIndicatorDto) {
    return this.indicatorsService.findAll(queryDto);
  }

  @Get('stats')
  getDashboardStats() {
    return this.indicatorsService.getDashboardStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.indicatorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIndicatorDto: UpdateIndicatorDto) {
    return this.indicatorsService.update(id, updateIndicatorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.indicatorsService.softDelete(id);
  }
}