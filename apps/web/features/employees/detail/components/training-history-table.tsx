'use client'

import { useMemo } from 'react'
import { cn } from '@workspace/ui/lib/utils'
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'
import { useDataTable } from '@/shared/components/niko-table/core/data-table-context'
import { useEmployeeTrainingHistoryColumns } from './training-history-columns'

/**
 * Component สำหรับแสดง Pagination แบบกำหนดเอง
 * แสดงข้อความจำนวนรายการทางซ้าย และตัวเลือกหน้าตรงกลาง
 */
function TrainingHistoryPagination({ totalCount }: { totalCount: number }) {
  const { table } = useDataTable()
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()

  // คำนวณช่วงของรายการที่กำลังแสดง (เช่น 1-25)
  const from = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalCount)

  // ฟังก์ชันสำหรับสร้างรายการหน้า (รองรับ Ellipsis ถ้าหน้าเยอะเกินไป)
  const renderPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (pageCount <= maxVisible) {
      for (let i = 0; i < pageCount; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => table.setPageIndex(i)}
              isActive={pageIndex === i}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // กรณีหน้าเยอะ ให้แสดงแบบมีจุดไข่ปลา (...)
      // แสดงหน้าแรก
      pages.push(
        <PaginationItem key={0}>
          <PaginationLink
            onClick={() => table.setPageIndex(0)}
            isActive={pageIndex === 0}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      if (pageIndex > 2) pages.push(<PaginationEllipsis key="left-ellipsis" />)

      // หน้าปัจจุบันและรอบข้าง
      const start = Math.max(1, pageIndex - 1)
      const end = Math.min(pageCount - 2, pageIndex + 1)

      for (let i = start; i <= end; i++) {
        if (i === 0 || i === pageCount - 1) continue
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => table.setPageIndex(i)}
              isActive={pageIndex === i}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        )
      }

      if (pageIndex < pageCount - 3)
        pages.push(<PaginationEllipsis key="right-ellipsis" />)

      // หน้าสุดท้าย
      pages.push(
        <PaginationItem key={pageCount - 1}>
          <PaginationLink
            onClick={() => table.setPageIndex(pageCount - 1)}
            isActive={pageIndex === pageCount - 1}
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return pages
  }

  if (totalCount === 0) return null

  return (
    <div className="relative flex items-center justify-between pt-3.5">
      {/* ฝั่งซ้าย: แสดงจำนวนรายการ */}
      <div className="text-sm text-slate-500">
        <span className="font-medium text-slate-700">
          {from}-{to}
        </span>{' '}
        จาก <span className="font-medium text-slate-700">{totalCount}</span>{' '}
        รายการ
      </div>

      {/* ตรงกลาง: ตัวเลขหน้า (ใช้ absolute center เพื่อให้ตรงเป๊ะ) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={cn(
                  'cursor-pointer transition-colors',
                  !table.getCanPreviousPage() &&
                    'pointer-events-none opacity-50'
                )}
                text=""
              />
            </PaginationItem>

            {renderPageNumbers()}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={cn(
                  'cursor-pointer transition-colors',
                  !table.getCanNextPage() && 'pointer-events-none opacity-50'
                )}
                text=""
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* ฝั่งขวา: Spacer เพื่อความสมดุล */}
      <div className="hidden sm:block sm:w-24" />
    </div>
  )
}

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
          <DataTableHeader className="bg-slate-50/80" />
          <DataTableBody className="[&_td]:py-2.5">
            <DataTableSkeleton rows={7} />

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

      <TrainingHistoryPagination totalCount={trainingRecords.length} />
    </DataTableRoot>
  )
}
