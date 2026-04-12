'use client'

import { Button } from '@workspace/ui/components/button'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { DataTableClearFilter } from '@/components/niko-table/components/data-table-clear-filter'
import { DataTableFacetedFilter } from '@/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import { DataTableViewMenu } from '@/components/niko-table/components/data-table-view-menu'
import { useDataTable } from '@/components/niko-table/core/data-table-context'
import { TableExportButton } from '@/components/niko-table/filters/table-export-button'
import type { ExportTableToCSVOptions } from '@/components/niko-table/filters/table-export-button'
import { SYSTEM_COLUMN_IDS } from '@/components/niko-table/lib/constants'
import { courseExportValueTransformers } from '../lib/export-value-transformers'
import {
  jobLevelOptions,
  prefixOptions,
  statusOptions,
} from '../lib/filter-options'
import type { EmployeeTreeRow } from './course-tree-columns'

export function CourseTreeFilterToolbar() {
  const { table } = useDataTable<EmployeeTreeRow>()

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2">
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="ค้นหาด้วย รหัสพนักงาน หรือ ชื่อ-นามสกุล..." />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsExpanded(true)}
          >
            <ChevronsDownUp className="mr-2 h-4 w-4" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.toggleAllRowsExpanded(false)}
          >
            <ChevronsUpDown className="mr-2 h-4 w-4" />
            Collapse All
          </Button>
          <TableExportButton
            table={table}
            filename={`ข้อมูลพนักงานแบบต้นไม้-${new Date().toISOString().split('T')[0]}`}
            label="ส่งออกข้อมูลทั้งหมด"
            useHeaderLabels
            valueTransformers={
              courseExportValueTransformers as NonNullable<
                ExportTableToCSVOptions<EmployeeTreeRow>['valueTransformers']
              >
            }
            excludeColumns={
              [SYSTEM_COLUMN_IDS.SELECT] as unknown as (keyof EmployeeTreeRow)[]
            }
          />
          <DataTableViewMenu />
        </div>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableFacetedFilter
          accessorKey="prefix"
          options={prefixOptions}
          multiple
        />
        <DataTableFacetedFilter
          accessorKey="jobLevel"
          options={jobLevelOptions}
          multiple
        />
        <DataTableFacetedFilter
          accessorKey="status"
          options={statusOptions}
          multiple
        />
        <DataTableClearFilter />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}
