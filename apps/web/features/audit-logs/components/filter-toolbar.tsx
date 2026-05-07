'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AuditAction, AuditLog, AuditLogQuery } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import { RefreshCw } from 'lucide-react'
import { DataTableClearFilter } from '@/shared/components/niko-table/components/data-table-clear-filter'
import { DataTableDateFilter } from '@/shared/components/niko-table/components/data-table-date-filter'
import { DataTableFacetedFilter } from '@/shared/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/shared/components/niko-table/components/data-table-search-filter'
import { DataTableToolbarSection } from '@/shared/components/niko-table/components/data-table-toolbar-section'
import { AUDIT_LOGS_QUERY_KEY } from '../options/query-options'

const actionOptions: { label: string; value: AuditAction }[] = [
  { label: 'สร้าง', value: 'Create' },
  { label: 'แก้ไข', value: 'Update' },
  { label: 'ลบ', value: 'Delete' },
  { label: 'นำเข้า', value: 'Import' },
  { label: 'ส่งออก', value: 'Export' },
  { label: 'ล้มเหลว', value: 'Failed' },
]

interface AuditLogTableFilterToolbarProps {
  params: AuditLogQuery
  auditLogs: AuditLog[]
}

// รวม model options จากข้อมูลปัจจุบันและค่าที่ถูกเลือกใน URL เพื่อไม่ให้ตัวเลือกหายระหว่างกรอง
function buildModelOptions(params: AuditLogQuery, auditLogs: AuditLog[]) {
  const values = new Set<string>()

  for (const auditLog of auditLogs) {
    if (auditLog.model) {
      values.add(auditLog.model)
    }
  }

  for (const selectedModel of params.model ?? []) {
    values.add(selectedModel)
  }

  return Array.from(values)
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      label: value,
      value,
    }))
}

// แสดง toolbar ของตาราง audit logs พร้อมตัวกรองที่ล็อกไว้ตาม spec
export function AuditLogTableFilterToolbar({
  params,
  auditLogs,
}: AuditLogTableFilterToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const modelOptions = useMemo(
    () => buildModelOptions(params, auditLogs),
    [params, auditLogs]
  )

  // รีเฟรช query ของ audit logs จาก react-query cache
  async function handleRefresh() {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: [AUDIT_LOGS_QUERY_KEY] })
    setIsRefreshing(false)
  }

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2.5">
      <DataTableToolbarSection className="mb-2 w-full justify-between px-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            ประวัติการใช้งานระบบ
          </h1>
          <p className="text-muted-foreground text-sm">
            ติดตามกิจกรรมและการเปลี่ยนแปลงที่เกิดขึ้นภายในระบบ
          </p>
        </div>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="w-full flex-wrap gap-3 px-0">
        <DataTableSearchFilter
          placeholder="ค้นหาด้วยผู้ใช้ กิจกรรม โมเดล หรือรหัสรายการ..."
          className="w-[360px] flex-none"
        />
        <DataTableDateFilter
          accessorKey="timestamp"
          title="ช่วงเวลา"
          multiple
        />
        <DataTableFacetedFilter
          accessorKey="model"
          title="โมเดล"
          options={modelOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableFacetedFilter
          accessorKey="action"
          title="กิจกรรม"
          options={actionOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
          showSearch={false}
        />
        <DataTableClearFilter size="lg" className="h-9">
          ล้างตัวกรอง
        </DataTableClearFilter>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-1 size-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            รีเฟรชข้อมูล
          </Button>
        </div>
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}
