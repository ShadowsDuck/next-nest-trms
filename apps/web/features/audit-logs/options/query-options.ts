import type { AuditLogQuery } from '@workspace/schemas'

export const AUDIT_LOGS_QUERY_KEY = 'audit-logs'
export const AUDIT_LOG_MODELS_QUERY_KEY = ['audit-log-models'] as const

// สร้าง react-query key จาก URL params เพื่อให้ cache แยกตามเงื่อนไขค้นหา
export function buildAuditLogsQueryKey(params: AuditLogQuery) {
  const model = params.model ?? []
  const action = params.action ?? []
  const dateRange = params.dateRange ?? []

  return [
    AUDIT_LOGS_QUERY_KEY,
    params.page,
    params.limit,
    params.search,
    model.join(','),
    action.join(','),
    dateRange.join(','),
  ] as const
}
