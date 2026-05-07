import { auditAction } from '@workspace/schemas'
import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'

export const auditLogParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25).withOptions({ clearOnDefault: false }),
  search: parseAsString.withDefault(''),
  model: parseAsArrayOf(parseAsString).withDefault([]),
  action: parseAsArrayOf(parseAsStringEnum([...auditAction])).withDefault([]),
  dateRange: parseAsArrayOf(parseAsInteger).withDefault([]),
}

export const auditLogSearchParamsCache =
  createSearchParamsCache(auditLogParsers)

export const serializeAuditLogParams = createSerializer(auditLogParsers)
