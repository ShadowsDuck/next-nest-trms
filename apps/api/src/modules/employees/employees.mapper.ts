import {
  BusinessUnit,
  Course,
  Department,
  Division,
  Employee,
  OrgFunction,
  Plant,
  Tag,
  TrainingRecord,
} from '@workspace/database';
import { toIsoDate, toIsoDateTime } from 'src/libs/date.mapper';
import { EmployeeResponseDto } from './dto/employee-response.dto';

export type EmployeeWithRelations = Employee & {
  plant: Plant;
  businessUnit: BusinessUnit;
  orgFunction: OrgFunction;
  division: Division;
  department: Department;
  trainingRecords?: (TrainingRecord & {
    course?: Course & {
      tag?: Tag | null;
    };
  })[];
};

export function formatEmployee(
  employee: EmployeeWithRelations,
): EmployeeResponseDto {
  const {
    plant,
    businessUnit,
    orgFunction,
    division,
    department,
    trainingRecords,
    ...employeeData
  } = employee;

  return {
    ...employeeData,
    hireDate: toIsoDate(employee.hireDate),
    createdAt: toIsoDateTime(employee.createdAt),
    updatedAt: toIsoDateTime(employee.updatedAt),
    plantName: plant.name,
    buName: businessUnit.name,
    functionName: orgFunction.name,
    divisionName: division.name,
    departmentName: department.name,
    trainingRecords: (trainingRecords ?? []).map((trainingRecord) => ({
      ...trainingRecord,
      createdAt: toIsoDateTime(trainingRecord.createdAt),
      updatedAt: toIsoDateTime(trainingRecord.updatedAt),
      course: trainingRecord.course
        ? {
            ...trainingRecord.course,
            startDate: toIsoDate(trainingRecord.course.startDate),
            endDate: toIsoDate(trainingRecord.course.endDate),
            startTime: trainingRecord.course.startTime
              ? trainingRecord.course.startTime.toISOString().slice(11, 19)
              : null,
            endTime: trainingRecord.course.endTime
              ? trainingRecord.course.endTime.toISOString().slice(11, 19)
              : null,
            duration: Number(trainingRecord.course.duration),
            expense: Number(trainingRecord.course.expense),
            createdAt: toIsoDateTime(trainingRecord.course.createdAt),
            updatedAt: toIsoDateTime(trainingRecord.course.updatedAt),
            tag: trainingRecord.course.tag
              ? {
                  id: trainingRecord.course.tag.id,
                  name: trainingRecord.course.tag.name,
                  colorCode: trainingRecord.course.tag.colorCode,
                }
              : undefined,
          }
        : undefined,
    })),
  };
}
