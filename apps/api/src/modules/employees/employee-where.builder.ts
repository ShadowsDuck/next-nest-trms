import { Prisma } from '@workspace/database';
import { EmployeeQueryDto } from './dto/employee-query.dto';

export function buildEmployeeWhereInput(
  queryDto: EmployeeQueryDto,
): Prisma.EmployeeWhereInput {
  const { search, prefix, jobLevel, divisionName, departmentName, status } =
    queryDto;

  const where: Prisma.EmployeeWhereInput = {};

  if (prefix && prefix.length > 0) {
    where.prefix = { in: prefix };
  }

  if (jobLevel && jobLevel.length > 0) {
    where.jobLevel = { in: jobLevel };
  }

  if (divisionName && divisionName.length > 0) {
    where.division = {
      name: { in: divisionName },
    };
  }

  if (departmentName && departmentName.length > 0) {
    where.department = {
      name: { in: departmentName },
    };
  }

  if (status && status.length > 0) {
    where.status = { in: status };
  }

  if (search) {
    where.OR = [
      {
        employeeNo: { contains: search, mode: 'insensitive' },
      },
      {
        firstName: { contains: search, mode: 'insensitive' },
      },
      {
        lastName: { contains: search, mode: 'insensitive' },
      },
      {
        idCardNo: { contains: search, mode: 'insensitive' },
      },
    ];
  }

  return where;
}
