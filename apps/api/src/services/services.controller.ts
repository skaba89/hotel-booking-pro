import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateServiceDto, UpdateServiceDto } from './services.dto';

@Controller()
export class ServicesController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('services')
  findAll() {
    return this.prisma.hotelService.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 100,
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('admin/services')
  create(@Body() dto: CreateServiceDto) {
    return this.prisma.hotelService.create({ data: dto });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/services/:id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.prisma.hotelService.update({ where: { id }, data: dto });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/services/:id')
  remove(@Param('id') id: string) {
    return this.prisma.hotelService.delete({ where: { id } });
  }
}
