'use client'

import { useMemo } from 'react'
import type { EmployeeSchemaResponse } from '@workspace/schemas'
import { DataTableClearFilter } from '@/components/niko-table/components/data-table-clear-filter'
import { DataTableFacetedFilter } from '@/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import { DataTableViewMenu } from '@/components/niko-table/components/data-table-view-menu'
import { useDataTable } from '@/components/niko-table/core/data-table-context'
import { TableExportButton } from '@/components/niko-table/filters/table-export-button'
import { SYSTEM_COLUMN_IDS } from '@/components/niko-table/lib/constants'
import { employeeExportValueTransformers } from '../lib/export-value-transformers'
import {
  jobLevelOptions,
  prefixOptions,
  statusOptions,
} from '../lib/filter-options'

/**
 * Toolbar filters using built-in niko-table controls.
 * Column header funnel filters are intentionally removed to keep UX simpler.
 */
export function EmployeeTableFilterToolbar() {
  const { table } = useDataTable<EmployeeSchemaResponse>()
  const exportDate = useMemo(() => new Date().toISOString().split('T')[0], [])
  const allExportFilename = useMemo(
    () => `ข้อมูลพนักงานทั้งหมด-${exportDate}`,
    [exportDate]
  )

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2">
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="ค้นหาด้วย รหัสพนักงาน หรือ ชื่อ-นามสกุล..." />
        <div className="flex items-center gap-2">
          <TableExportButton
            table={table}
            filename={allExportFilename}
            label="ส่งออกข้อมูลทั้งหมด"
            useHeaderLabels
            valueTransformers={employeeExportValueTransformers}
            excludeColumns={
              [
                SYSTEM_COLUMN_IDS.SELECT,
              ] as unknown as (keyof EmployeeSchemaResponse)[]
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
