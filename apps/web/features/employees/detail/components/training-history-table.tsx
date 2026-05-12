'use client'

import { useMemo } from 'react'
import type { TrainingRecordResponse } from '@workspace/schemas'
import { GraduationCap } from 'lucide-react'
import {
  DataTableEmptyBody,
  DataTableHeader,
  DataTableBody,
  DataTableSkeleton,
} from '@/shared/components/niko-table/core/data-table-structure'
import {
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from '@/shared/components/niko-table/components/data-table-empty-state'
import { DataTable } from '@/shared/components/niko-table/core/data-table'
import { DataTableRoot } from '@/shared/components/niko-table/core/data-table-root'
import { TableCell, TableRow } from '@workspace/ui/components/table'
import { DataTableNumberedPagination } from '@/shared/components/niko-table/components/data-table-numbered-pagination'
import { useEmployeeTrainingHistoryColumns } from './training-history-columns'

// แสดงตารางประวัติการอบรมแบบอ่านอย่างเดียวด้วย Niko Table และแสดงยาวลงมาเลย
export function EmployeeTrainingHistoryTable({
  trainingRecords,
  onPreviewCertificate,
}: {
  trainingRecords: TrainingRecordResponse[]
  onPreviewCertificate: (trainingRecord: TrainingRecordResponse) => void
}) {
  const columns = useEmployeeTrainingHistoryColumns({
    onPreviewCertificate,
  })

  const tableConfig = useMemo(
    () => ({
      initialPageSize: 7,
      enablePagination: true,
      enableRowSelection: false,
    }),
    []
  )

  const MIN_ROWS = 7
  const emptyRowsCount = Math.max(0, MIN_ROWS - trainingRecords.length)

  return (
    <DataTableRoot
      data={trainingRecords}
      columns={columns}
      getRowId={(row) => row.id}
      config={tableConfig}
    >
      <div className="overflow-hidden rounded-lg">
        <DataTable className="min-h-0">
          <DataTableHeader className="bg-muted/80" />
          <DataTableBody className="[&_td]:py-2.5">
            <DataTableSkeleton rows={MIN_ROWS} />

            {/* แสดง Empty State เมื่อไม่มีข้อมูลเลย */}
            {trainingRecords.length === 0 && (
              <DataTableEmptyBody className="py-36!">
                <DataTableEmptyIcon>
                  <GraduationCap className="size-10" />
                </DataTableEmptyIcon>
                <DataTableEmptyMessage>
                  <DataTableEmptyTitle>
                    ยังไม่พบประวัติการอบรม
                  </DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    พนักงานคนนี้ยังไม่มีรายการอบรมในระบบ
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
              </DataTableEmptyBody>
            )}

            {/* แสดงแถวว่างเพื่อให้ตารางดูยาวสม่ำเสมอ เฉพาะกรณีที่มีข้อมูลบางส่วน */}
            {trainingRecords.length > 0 &&
              emptyRowsCount > 0 &&
              Array.from({ length: emptyRowsCount }).map((_, i) => (
                <TableRow key={`empty-${i}`} className="hover:bg-transparent">
                  {columns.map((_, j) => (
                    <TableCell key={`empty-cell-${j}`} className="h-[52px]" />
                  ))}
                </TableRow>
              ))}
          </DataTableBody>
        </DataTable>
      </div>

      <DataTableNumberedPagination totalCount={trainingRecords.length} />
    </DataTableRoot>
  )
}
