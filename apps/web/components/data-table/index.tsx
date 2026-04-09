'use client'

import { useMemo } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'
import type { ColDef, GridOptions } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useTheme } from 'next-themes'
import { darkTheme, lightTheme } from '@/lib/ag-grid-themes'

ModuleRegistry.registerModules([AllCommunityModule])

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TData> {
  rowData: TData[]
  columnDefs: ColDef<TData>[]
  title: string
  description?: string
  totalLabel?: () => string
  headerActions?: React.ReactNode
  defaultColDef?: ColDef
  pageSizeOptions?: number[]
  gridOptions?: GridOptions<TData>
  height?: string
  currentPage: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  isLoading?: boolean
  isError?: boolean
}

// ─── Pagination helper ────────────────────────────────────────────────────────

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (currentPage > 3) pages.push('ellipsis')

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (currentPage < totalPages - 2) pages.push('ellipsis')

  pages.push(totalPages)

  return pages
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  rowData,
  columnDefs,
  title,
  description,
  totalLabel,
  headerActions,
  defaultColDef: defaultColDefProp,
  pageSizeOptions = [20, 50, 100],
  gridOptions,
  height = 'calc(100dvh - 130px)',
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  isError = false,
}: DataTableProps<TData>) {
  const { resolvedTheme } = useTheme()
  const gridTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme

  const defaultColDef = useMemo<ColDef>(
    () => ({ sortable: true, resizable: true, ...defaultColDefProp }),
    [defaultColDefProp]
  )

  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className="flex flex-col w-full p-4 overflow-hidden"
      style={{ height }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {totalLabel && (
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
              {totalLabel()}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="mb-3 px-4 py-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm shrink-0">
          เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
        </div>
      )}

      {/* Grid */}
      <div className="w-full flex-1 min-h-0 shadow-sm border rounded-lg overflow-hidden">
        <AgGridReact
          theme={gridTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loading={isLoading}
          pagination={false}
          animateRows={true}
          {...gridOptions}
        />
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between mt-3 shrink-0">
        {/* Page size selector */}
        <PaginationPageSize
          value={pageSize}
          options={pageSizeOptions}
          onChange={onPageSizeChange}
        />

        {/* Page navigation */}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="ก่อนหน้า"
                onClick={() => onPageChange(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1
                    ? 'pointer-events-none opacity-40'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

            {pageNumbers.map((page, i) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => onPageChange(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                text="ถัดไป"
                onClick={() => onPageChange(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? 'pointer-events-none opacity-40'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
