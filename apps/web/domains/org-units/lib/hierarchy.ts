import { getBusinessUnits } from '../data/get-business-units'
import { getDepartments } from '../data/get-departments'
import { getDivisions } from '../data/get-divisions'
import { getFunctions } from '../data/get-functions'
import { getPlants } from '../data/get-plants'
import type { OrganizationOption } from './types'
import { sortOrgUnitsByName } from './utils'

export type OrganizationHierarchyField =
  | 'plantId'
  | 'buId'
  | 'functionId'
  | 'divisionId'
  | 'departmentId'

export type OrganizationHierarchySelection = {
  plantId?: string
  buId?: string
  functionId?: string
  divisionId?: string
}

export type OrganizationHierarchyOptions = {
  plantOptions: OrganizationOption[]
  buOptions: OrganizationOption[]
  functionOptions: OrganizationOption[]
  divisionOptions: OrganizationOption[]
  departmentOptions: OrganizationOption[]
}

export class OrganizationHierarchyLoadError extends Error {
  constructor(
    readonly level:
      | 'plants'
      | 'businessUnits'
      | 'functions'
      | 'divisions'
      | 'departments',
    readonly options: OrganizationHierarchyOptions
  ) {
    super(level)
  }
}

// สร้างค่าตั้งต้นของตัวเลือกหน่วยงานทุกระดับให้พร้อมใช้งานใน hook
export function createEmptyOrganizationHierarchyOptions(): OrganizationHierarchyOptions {
  return {
    plantOptions: [],
    buOptions: [],
    functionOptions: [],
    divisionOptions: [],
    departmentOptions: [],
  }
}

// คืนรายการฟิลด์ลูกที่ต้องล้างค่าเมื่อฟิลด์แม่ใน hierarchy เปลี่ยนแปลง
export function getOrganizationHierarchyResetFields(
  field: OrganizationHierarchyField
): OrganizationHierarchyField[] {
  switch (field) {
    case 'plantId':
      return ['buId', 'functionId', 'divisionId', 'departmentId']
    case 'buId':
      return ['functionId', 'divisionId', 'departmentId']
    case 'functionId':
      return ['divisionId', 'departmentId']
    case 'divisionId':
      return ['departmentId']
    default:
      return []
  }
}

// โหลดตัวเลือกหน่วยงานตาม selection ปัจจุบันพร้อมรักษาผลลัพธ์ที่โหลดได้ก่อนเกิดข้อผิดพลาด
export async function loadOrganizationHierarchyOptions(
  selection: OrganizationHierarchySelection
): Promise<OrganizationHierarchyOptions> {
  const options = createEmptyOrganizationHierarchyOptions()

  try {
    options.plantOptions = sortOrgUnitsByName(await getPlants())
  } catch {
    throw new OrganizationHierarchyLoadError('plants', options)
  }

  if (!selection.plantId) {
    return options
  }

  try {
    options.buOptions = sortOrgUnitsByName(
      await getBusinessUnits(selection.plantId)
    )
  } catch {
    throw new OrganizationHierarchyLoadError('businessUnits', options)
  }

  if (!selection.buId) {
    return options
  }

  try {
    options.functionOptions = sortOrgUnitsByName(
      await getFunctions(selection.buId)
    )
  } catch {
    throw new OrganizationHierarchyLoadError('functions', options)
  }

  if (!selection.functionId) {
    return options
  }

  try {
    options.divisionOptions = sortOrgUnitsByName(
      await getDivisions(selection.functionId)
    )
  } catch {
    throw new OrganizationHierarchyLoadError('divisions', options)
  }

  if (!selection.divisionId) {
    return options
  }

  try {
    options.departmentOptions = sortOrgUnitsByName(
      await getDepartments(selection.divisionId)
    )
  } catch {
    throw new OrganizationHierarchyLoadError('departments', options)
  }

  return options
}
