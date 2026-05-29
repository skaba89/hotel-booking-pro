import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateStaffMemberDto,
  UpdateStaffMemberDto,
  CreateShiftDto,
  UpdateShiftDto,
} from './staff.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'STAFF')
@Controller('admin/staff')
export class StaffController {
  constructor(private prisma: PrismaService) {}

  // ---- Staff members ----

  @Get()
  findAll(@Query('department') department?: string, @Query('active') active?: string) {
    return this.prisma.staffMember.findMany({
      where: {
        ...(department ? { department: department as any } : {}),
        ...(active === 'true' ? { isActive: true } : {}),
        ...(active === 'false' ? { isActive: false } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    });
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateStaffMemberDto) {
    const { hireDate, ...rest } = dto;
    return this.prisma.staffMember.create({
      data: { ...rest, ...(hireDate ? { hireDate: new Date(hireDate) } : {}) },
    });
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffMemberDto) {
    const { hireDate, ...rest } = dto;
    return this.prisma.staffMember.update({
      where: { id },
      data: { ...rest, ...(hireDate !== undefined ? { hireDate: hireDate ? new Date(hireDate) : null } : {}) },
    });
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.staffMember.delete({ where: { id } });
  }

  // ---- Shifts (planning) ----

  @Get('shifts')
  findShifts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.prisma.staffShift.findMany({
      where: {
        ...(staffId ? { staffId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  @Roles('ADMIN')
  @Post('shifts')
  createShift(@Body() dto: CreateShiftDto) {
    const { date, ...rest } = dto;
    return this.prisma.staffShift.create({
      data: { ...rest, date: new Date(date) },
    });
  }

  @Roles('ADMIN')
  @Patch('shifts/:id')
  updateShift(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    const { date, ...rest } = dto;
    return this.prisma.staffShift.update({
      where: { id },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
  }

  @Roles('ADMIN')
  @Delete('shifts/:id')
  removeShift(@Param('id') id: string) {
    return this.prisma.staffShift.delete({ where: { id } });
  }
}
