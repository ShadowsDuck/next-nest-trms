import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CoursesModule } from '../courses/courses.module';
import { EmployeesModule } from '../employees/employees.module';
import { SummaryReportsController } from './summary-reports.controller';
import { SummaryReportsService } from './summary-reports.service';

@Module({
  imports: [AuditLogsModule, EmployeesModule, CoursesModule],
  controllers: [SummaryReportsController],
  providers: [SummaryReportsService],
})
export class SummaryReportsModule {}
