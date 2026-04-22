import { Module } from '@nestjs/common';
import { EmployeeImportService } from './employee-import.service';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeImportService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
