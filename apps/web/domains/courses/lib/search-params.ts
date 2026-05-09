import { accreditationStatus, courseType } from '@workspace/schemas'
import type { CourseQuery } from '@workspace/schemas'
import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'
import type { TableFilterConfig } from '@/shared/lib/table-state'

type CourseTableFilterKey =
  | 'type'
  | 'tagName'
  | 'dateRange'
  | 'durationRange'
  | 'accreditationStatus'

export const courseParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: false }),
  search: parseAsString.withDefault(''),
  type: parseAsArrayOf(parseAsStringEnum([...courseType])).withDefault([]),
  tagName: parseAsArrayOf(parseAsString).withDefault([]),
  dateRange: parseAsArrayOf(parseAsInteger).withDefault([]),
  durationRange: parseAsArrayOf(parseAsInteger).withDefault([]),
  accreditationStatus: parseAsArrayOf(
    parseAsStringEnum([...accreditationStatus])
  ).withDefault([]),
}

export const courseSearchParamsCache = createSearchParamsCache(courseParsers)

export const serializeCourseParams = createSerializer(courseParsers)

export const courseTableFilterKeys = [
  'type',
  'tagName',
  'dateRange',
  'durationRange',
  'accreditationStatus',
] as const satisfies readonly CourseTableFilterKey[]

export const courseTableFilterDefaults: Pick<
  CourseQuery,
  CourseTableFilterKey
> = {
  type: [],
  tagName: [],
  dateRange: [],
  durationRange: [],
  accreditationStatus: [],
}

export const courseTableFilterConfig = [
  {
    paramKey: 'type',
    valueType: 'string',
    allowedValues: courseType,
  },
  {
    paramKey: 'tagName',
    valueType: 'string',
  },
  {
    paramKey: 'dateRange',
    valueType: 'number',
  },
  {
    paramKey: 'durationRange',
    columnId: 'duration',
    valueType: 'number',
  },
  {
    paramKey: 'accreditationStatus',
    valueType: 'string',
    allowedValues: accreditationStatus,
  },
] as const satisfies TableFilterConfig<CourseTableFilterKey>
