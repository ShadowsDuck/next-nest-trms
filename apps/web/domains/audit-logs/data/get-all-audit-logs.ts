import {
  type AuditLogPaginationResponse,
  type AuditLogQuery,
  auditLogPaginationResponseSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'
import { serializeAuditLogParams } from '../lib/search-params'

// ดึงข้อมูล audit logs จาก API แล้วตรวจ schema ของ response ก่อนใช้งาน
export async function getAllAuditLogs(
  params: AuditLogQuery
): Promise<AuditLogPaginationResponse> {
  const endpoint = `/api/audit-logs${serializeAuditLogParams(params)}`

  const data = await api.get<AuditLogPaginationResponse>(endpoint, {
    cache: 'no-store',
  })

  return auditLogPaginationResponseSchema.parse(data)
}
