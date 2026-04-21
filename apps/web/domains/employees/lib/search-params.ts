import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'

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
