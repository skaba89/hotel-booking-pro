import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReviewDto } from './reviews.dto';

@Controller()
export class ReviewsController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('reviews')
  findApproved() {
    return this.prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reviews')
  create(@Body() dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: { ...dto, isApproved: false },
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/reviews')
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/reviews/:id/approve')
  approve(@Param('id') id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/reviews/:id')
  remove(@Param('id') id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
