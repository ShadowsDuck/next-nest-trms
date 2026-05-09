import { Module } from '@nestjs/common';
import { OrganizationUnitsController } from './organization-units.controller';
import { OrganizationUnitsService } from './organization-units.service';

@Module({
  controllers: [OrganizationUnitsController],
  providers: [OrganizationUnitsService],
  exports: [OrganizationUnitsService],
})
export class OrganizationUnitsModule {}
