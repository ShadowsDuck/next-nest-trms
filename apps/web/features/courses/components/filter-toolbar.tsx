'use client'

import { DataTableClearFilter } from '@/components/niko-table/components/data-table-clear-filter'
import { DataTableFacetedFilter } from '@/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import {
  accreditationStatusOptions,
  courseTypeOptions,
} from '../lib/filter-options'

export function CourseTableFilterToolbar() {
  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2.5">
      <DataTableToolbarSection className="w-full justify-between px-0">
        <h1 className="text-2xl font-semibold tracking-tight">
          ข้อมูลหลักสูตร
        </h1>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="ค้นหาด้วย ชื่อหลักสูตร, วิทยากร หรือ สถาบัน..." />
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableFacetedFilter
          accessorKey="type"
          options={courseTypeOptions}
          multiple
          showCounts={false}
        />
        <DataTableFacetedFilter
          accessorKey="accreditationStatus"
          options={accreditationStatusOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableClearFilter>ล้างตัวกรอง</DataTableClearFilter>
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}
