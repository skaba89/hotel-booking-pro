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
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
  CreateDocumentFromBookingDto,
  DocumentQueryDto,
} from './documents.dto';
import { Public, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('documents')
@Controller()
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  // ---- Admin (back-office) ----

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/documents')
  create(@Body() dto: CreateDocumentDto) {
    return this.documents.create(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/documents/from-booking')
  createFromBooking(@Body() dto: CreateDocumentFromBookingDto) {
    return this.documents.createFromBooking(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/documents')
  findAll(@Query() query: DocumentQueryDto) {
    return this.documents.findAll(query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/documents/:id')
  findOne(@Param('id') id: string) {
    return this.documents.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('admin/documents/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Patch('admin/documents/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documents.updateStatus(id, dto.status);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/documents/:id/convert')
  convert(@Param('id') id: string) {
    return this.documents.convertToInvoice(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Post('admin/documents/:id/send')
  send(@Param('id') id: string) {
    return this.documents.sendByEmail(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get('admin/documents/:id/pdf')
  async adminPdf(@Param('id') id: string, @Res() res: Response) {
    const { doc, pdf } = await this.documents.generatePdfById(id);
    this.sendPdf(res, doc, pdf);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/documents/:id')
  remove(@Param('id') id: string) {
    return this.documents.remove(id);
  }

  // ---- Public (lien sécurisé par token) ----

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('documents/:token')
  publicView(@Param('token') token: string) {
    return this.documents.findByPublicToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('documents/:token/pdf')
  async publicPdf(@Param('token') token: string, @Res() res: Response) {
    const { doc, pdf } = await this.documents.generatePdfByToken(token);
    this.sendPdf(res, doc, pdf);
  }

  private sendPdf(res: Response, doc: { type: string; number: string }, pdf: Buffer) {
    const label = doc.type === 'QUOTE' ? 'devis' : 'facture';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${label}-${doc.number}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
