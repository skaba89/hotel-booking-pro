import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, QuoteDto, BookingQueryDto, UpdateBookingStatusDto, BookingLookupDto } from './bookings.dto';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Public()
  @Post('bookings/quote')
  getQuote(@Body() dto: QuoteDto) {
    return this.bookingsService.getQuote(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('bookings')
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('bookings/lookup')
  findByReference(@Body() dto: BookingLookupDto) {
    return this.bookingsService.findByReferenceSecure(dto.reference, dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('bookings/cancel')
  cancelByReference(@Body() dto: BookingLookupDto) {
    return this.bookingsService.cancelByReferenceSecure(dto.reference, dto.email);
  }

  // Keep old GET route for payment page (internal, limited data)
  @Public()
  @Get('bookings/:reference')
  findByReferenceLimited(@Param('reference') reference: string) {
    return this.bookingsService.findByReferenceLimited(reference);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/bookings')
  findAll(@Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/bookings/:id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findByReference(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('admin/bookings/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status, dto.reason);
  }
}
