import {
  BusinessUnit,
  Course,
  Department,
  Division,
  Employee,
  OrgFunction,
  Plant,
  Tag,
} from '@workspace/database';
import { toIsoDate, toIsoDateTime } from 'src/libs/date.mapper';
import { CourseResponseDto } from './dto/course-response.dto';

type CourseEmployee = Employee & {
  plant: Plant;
  businessUnit: BusinessUnit;
  orgFunction: OrgFunction;
  division: Division;
  department: Department;
};

export type CourseWithRelations = Course & {
  tag: Tag;
  trainingRecords?: {
    employee: CourseEmployee;
  }[];
};

export function formatCourse(course: CourseWithRelations): CourseResponseDto {
  return {
    ...course,
    startDate: toIsoDate(course.startDate),
    endDate: toIsoDate(course.endDate),
    startTime: course.startTime
      ? course.startTime.toISOString().slice(11, 19)
      : null,
    endTime: course.endTime ? course.endTime.toISOString().slice(11, 19) : null,
    duration: Number(course.duration),
    expense: Number(course.expense),
    createdAt: toIsoDateTime(course.createdAt),
    updatedAt: toIsoDateTime(course.updatedAt),
    tag: {
      id: course.tag.id,
      name: course.tag.name,
      colorCode: course.tag.colorCode,
    },
    participants: (course.trainingRecords ?? []).map((trainingRecord) => ({
      id: trainingRecord.employee.id,
      employeeNo: trainingRecord.employee.employeeNo,
      prefix: trainingRecord.employee.prefix,
      firstName: trainingRecord.employee.firstName,
      lastName: trainingRecord.employee.lastName,
      hireDate: toIsoDate(trainingRecord.employee.hireDate),
      jobLevel: trainingRecord.employee.jobLevel,
      status: trainingRecord.employee.status,
      plantName: trainingRecord.employee.plant.name,
      buName: trainingRecord.employee.businessUnit.name,
      functionName: trainingRecord.employee.orgFunction.name,
      divisionName: trainingRecord.employee.division.name,
      departmentName: trainingRecord.employee.department.name,
    })),
  };
}
