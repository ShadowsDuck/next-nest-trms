import type { RowSelectionState } from '@tanstack/react-table'

// สร้าง timestamp สำหรับชื่อไฟล์ export ให้ใช้รูปแบบเดิมทุก feature
export function buildListPageExportTimestamp(now: Date): string {
  const date = now.toISOString().split('T')[0] ?? ''
  const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
  return `${date}_${time}`
}

// นับจำนวนแถวที่ถูกเลือกจาก rowSelection state ของ TanStack Table
export function countSelectedRows(rowSelection: RowSelectionState): number {
  return Object.values(rowSelection).filter(Boolean).length
}
