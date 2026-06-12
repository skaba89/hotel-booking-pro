import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
