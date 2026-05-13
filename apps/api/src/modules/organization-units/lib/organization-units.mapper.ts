import { toIsoDateTime } from '@/utils/date-utils';
import {
  BusinessUnitResponse,
  DepartmentResponse,
  DivisionResponse,
  OrgFunctionResponse,
  PlantResponse,
} from '@workspace/schemas';

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็น Response Format สำหรับ Plant
 */
export function mapPlant(data: any): PlantResponse {
  return {
    id: data.id,
    name: data.name,
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็น Response Format สำหรับ Business Unit
 */
export function mapBusinessUnit(data: any): BusinessUnitResponse {
  return {
    id: data.id,
    name: data.name,
    plantId: data.plantId,
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็น Response Format สำหรับ Org Function
 */
export function mapOrgFunction(data: any): OrgFunctionResponse {
  return {
    id: data.id,
    name: data.name,
    businessUnitId: data.businessUnitId,
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็น Response Format สำหรับ Division
 */
export function mapDivision(data: any): DivisionResponse {
  return {
    id: data.id,
    name: data.name,
    functionId: data.functionId,
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็น Response Format สำหรับ Department
 */
export function mapDepartment(data: any): DepartmentResponse {
  return {
    id: data.id,
    name: data.name,
    divisionId: data.divisionId,
    createdAt: toIsoDateTime(data.createdAt),
    updatedAt: toIsoDateTime(data.updatedAt),
  };
}
