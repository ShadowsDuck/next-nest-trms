'use client'
'use no memo'

import { cn } from '@workspace/ui/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'
import { useDataTable } from '../core/data-table-context'

/**
 * คอมโพเนนต์แสดง Pagination แบบตัวเลขและจุดไข่ปลา
 * แสดงข้อความจำนวนรายการทางซ้าย และตัวเลือกหน้าตรงกลาง
 */
export function DataTableNumberedPagination({
  totalCount,
}: {
  totalCount: number
}) {
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
    <div className="relative flex items-center justify-between pt-5">
      {/* ฝั่งซ้าย: แสดงจำนวนรายการ */}
      <div className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium">
          {from}-{to}
        </span>{' '}
        จาก <span className="text-foreground font-medium">{totalCount}</span>{' '}
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
