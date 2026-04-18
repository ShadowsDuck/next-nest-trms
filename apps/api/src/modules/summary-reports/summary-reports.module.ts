import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EmployeesModule } from '../employees/employees.module';
import { SummaryReportsController } from './summary-reports.controller';
import { SummaryReportsService } from './summary-reports.service';

@Module({
  imports: [EmployeesModule, CoursesModule],
  controllers: [SummaryReportsController],
  providers: [SummaryReportsService],
})
export class SummaryReportsModule {}
