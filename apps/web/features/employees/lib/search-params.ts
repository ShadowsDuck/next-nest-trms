import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'

export const employeeParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
  search: parseAsString.withDefault(''),
  prefix: parseAsArrayOf(parseAsStringEnum([...prefix])).withDefault([]),
  jobLevel: parseAsArrayOf(parseAsStringEnum([...jobLevel])).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum([...employeeStatus])).withDefault(
    []
  ),
}

export const employeeSearchParamsCache =
  createSearchParamsCache(employeeParsers)
