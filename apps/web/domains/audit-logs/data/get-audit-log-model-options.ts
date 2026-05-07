import {
  type AuditLogModelOptions,
  auditLogModelOptionsSchema,
} from '@workspace/schemas'
import { api } from '@/shared/lib/fetcher'

// ดึงรายการ model ทั้งหมดสำหรับใช้เป็นตัวเลือกใน filter ของ audit logs
export async function getAuditLogModelOptions(): Promise<AuditLogModelOptions> {
  const data = await api.get<AuditLogModelOptions>('/api/audit-logs/models', {
    cache: 'no-store',
  })

  return auditLogModelOptionsSchema.parse(data)
}
