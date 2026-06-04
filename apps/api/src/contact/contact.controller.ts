import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContactService } from './contact.service';
import { CreateContactMessageDto, UpdateContactStatusDto, SubscribeNewsletterDto } from './contact.dto';

@ApiTags('contact')
@Controller()
export class ContactController {
  constructor(private contactService: ContactService) {}

  // ── Contact messages ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Soumettre un message de contact' })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('contact')
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.createMessage(dto);
  }

  @ApiOperation({ summary: 'Lister les messages de contact (ADMIN/STAFF)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/contact-messages')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.contactService.findAllMessages(Number(page), Number(limit), status);
  }

  @ApiOperation({ summary: 'Changer le statut d\'un message de contact (ADMIN/STAFF)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('admin/contact-messages/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.contactService.updateMessageStatus(id, dto);
  }

  // ── Newsletter ─────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'S\'abonner à la newsletter' })
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('newsletter/subscribe')
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.contactService.subscribe(dto);
  }

  @ApiOperation({ summary: 'Se désabonner de la newsletter' })
  @Public()
  @Post('newsletter/unsubscribe')
  unsubscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.contactService.unsubscribe(dto);
  }

  @ApiOperation({ summary: 'Lister les abonnés newsletter (ADMIN)' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin/newsletter/subscribers')
  getSubscribers(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.contactService.getSubscribers(Number(page), Number(limit));
  }
}
