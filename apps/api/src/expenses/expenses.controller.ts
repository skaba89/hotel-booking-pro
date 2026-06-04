import { ApiTags } from '@nestjs/swagger';
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
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
} from './expenses.dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('expenses')
@Controller('admin/expenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Roles('ADMIN', 'STAFF')
  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser('id') userId: string) {
    return this.expenses.create(dto, userId);
  }

  @Roles('ADMIN', 'STAFF')
  @Get()
  findAll(@Query() query: ExpenseQueryDto) {
    return this.expenses.findAll(query);
  }

  @Roles('ADMIN', 'STAFF')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenses.findOne(id);
  }

  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expenses.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenses.remove(id);
  }
}
