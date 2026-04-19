import { accreditationStatus, courseType } from '@workspace/schemas'
import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'

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
