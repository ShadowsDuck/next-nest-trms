import { type EmployeeSchemaResponse } from '@workspace/schemas'
import type { ExportTableToCSVOptions } from '@/components/niko-table/filters/table-export-button'
import { prefixOptions, statusOptions } from './filter-options'

const prefixLabelMap = new Map(
  prefixOptions.map((item) => [item.value, item.label])
)
const statusLabelMap = new Map(
  statusOptions.map((item) => [item.value, item.label])
)

export const employeeExportValueTransformers: NonNullable<
  ExportTableToCSVOptions<EmployeeSchemaResponse>['valueTransformers']
> = {
  prefix: (value) => prefixLabelMap.get(value as any) ?? value,
  status: (value) => statusLabelMap.get(value as any) ?? value,
}
