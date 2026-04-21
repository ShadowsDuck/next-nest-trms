import type { EmployeeQuery } from '@workspace/schemas'
import { getAllEmployeesExport } from '@/domains/employees/data/get-all-employees-export'
import { triggerCsvDownload } from '@/shared/components/niko-table/filters/table-export-button'
import { buildEmployeeCourseRows } from './export-employee-utils'

export async function exportEmployeesWithCoursesCSV({
  params,
  filename,
  selectedEmployeeNos,
}: {
  params: EmployeeQuery
  filename: string
  selectedEmployeeNos?: string[]
}) {
  const response = await getAllEmployeesExport(params, {
    includeTrainingRecords: true,
  })
  const selectedSet =
    selectedEmployeeNos && selectedEmployeeNos.length > 0
      ? new Set(selectedEmployeeNos)
      : null

  const employees =
    selectedSet == null
      ? response.data
      : response.data.filter((employee) => selectedSet.has(employee.employeeNo))

  triggerCsvDownload(filename, buildEmployeeCourseRows(employees))
}
