import { type EmployeeResponse } from '@workspace/schemas'
import type { ExportTableToCSVOptions } from '@/components/niko-table/filters/table-export-button'
import { prefixOptions, statusOptions } from './filter-options'

const prefixLabelMap = new Map<string, string>(
  prefixOptions.map((item) => [item.value, item.label])
)
const statusLabelMap = new Map<string, string>(
  statusOptions.map((item) => [item.value, item.label])
)

export const employeeExportValueTransformers: NonNullable<
  ExportTableToCSVOptions<EmployeeResponse>['valueTransformers']
> = {
  fullName: (_value, row) => {
    const prefixLabel = prefixLabelMap.get(row.prefix) ?? row.prefix
    return `${prefixLabel} ${row.firstName} ${row.lastName}`
  },
  prefix: (value) =>
    typeof value === 'string' ? (prefixLabelMap.get(value) ?? value) : value,
  status: (value) =>
    typeof value === 'string' ? (statusLabelMap.get(value) ?? value) : value,
}
