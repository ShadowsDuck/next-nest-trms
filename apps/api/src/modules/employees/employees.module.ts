import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EmployeeImportService } from './employee-import.service';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeImportService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
