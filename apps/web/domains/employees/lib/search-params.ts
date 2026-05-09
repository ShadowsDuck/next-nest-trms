import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import type { EmployeeQuery } from '@workspace/schemas'
import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'
import type { TableFilterConfig } from '@/shared/lib/table-state'

type EmployeeTableFilterKey =
  | 'prefix'
  | 'jobLevel'
  | 'divisionName'
  | 'departmentName'
  | 'status'

export const employeeParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: false }),
  search: parseAsString.withDefault(''),
  prefix: parseAsArrayOf(parseAsStringEnum([...prefix])).withDefault([]),
  jobLevel: parseAsArrayOf(parseAsStringEnum([...jobLevel])).withDefault([]),
  divisionName: parseAsArrayOf(parseAsString).withDefault([]),
  departmentName: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum([...employeeStatus])).withDefault(
    []
  ),
}

export const employeeSearchParamsCache =
  createSearchParamsCache(employeeParsers)

export const serializeEmployeeParams = createSerializer(employeeParsers)

export const employeeTableFilterKeys = [
  'prefix',
  'jobLevel',
  'divisionName',
  'departmentName',
  'status',
] as const satisfies readonly EmployeeTableFilterKey[]

export const employeeTableFilterDefaults: Pick<
  EmployeeQuery,
  EmployeeTableFilterKey
> = {
  prefix: [],
  jobLevel: [],
  divisionName: [],
  departmentName: [],
  status: [],
}

export const employeeTableFilterConfig = [
  {
    paramKey: 'prefix',
    valueType: 'string',
    allowedValues: prefix,
  },
  {
    paramKey: 'jobLevel',
    valueType: 'string',
    allowedValues: jobLevel,
  },
  {
    paramKey: 'divisionName',
    valueType: 'string',
  },
  {
    paramKey: 'departmentName',
    valueType: 'string',
  },
  {
    paramKey: 'status',
    valueType: 'string',
    allowedValues: employeeStatus,
  },
] as const satisfies TableFilterConfig<EmployeeTableFilterKey>
