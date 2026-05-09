import { auditAction } from '@workspace/schemas'
import type { AuditLogQuery } from '@workspace/schemas'
import {
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'
import type { TableFilterConfig } from '@/shared/lib/table-state'

type AuditLogTableFilterKey = 'model' | 'action' | 'dateRange'

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

export const auditLogTableFilterKeys = [
  'model',
  'action',
  'dateRange',
] as const satisfies readonly AuditLogTableFilterKey[]

export const auditLogTableFilterDefaults: Pick<
  AuditLogQuery,
  AuditLogTableFilterKey
> = {
  model: [],
  action: [],
  dateRange: [],
}

export const auditLogTableFilterConfig = [
  {
    paramKey: 'model',
    valueType: 'string',
  },
  {
    paramKey: 'action',
    valueType: 'string',
    allowedValues: auditAction,
  },
  {
    paramKey: 'dateRange',
    columnId: 'timestamp',
    valueType: 'number',
  },
] as const satisfies TableFilterConfig<AuditLogTableFilterKey>
