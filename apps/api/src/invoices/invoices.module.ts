import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [InvoicesController],
})
export class InvoicesModule {}
