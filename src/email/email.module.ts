import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService], // <-- Important : Exporter EmailService
})
export class EmailModule {}
