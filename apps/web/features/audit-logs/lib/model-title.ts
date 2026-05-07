export const auditLogModelTitleMap = {
  Employee: 'ข้อมูลพนักงาน',
  Course: 'ข้อมูลหลักสูตร',
  SummaryReport: 'รายงานสรุป',
} as const satisfies Record<string, string>

// แปลงชื่อ model ของ audit log เป็นภาษาไทยสำหรับใช้ในหน้า audit logs
export function getAuditLogModelTitle(model: string): string {
  return (
    auditLogModelTitleMap[model as keyof typeof auditLogModelTitleMap] ?? model
  )
}
