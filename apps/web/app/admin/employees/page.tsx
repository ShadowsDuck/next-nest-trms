import { Suspense } from 'react'
import { EmployeeTable } from '@/features/employees/components/employee-table'
import { fetchEmployees } from '@/features/employees/data'
import { employeeSearchParamsCache } from '@/features/employees/lib/search-params'
import EmployeesLoading from './loading'

interface iAppProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function EmployeesContent({ searchParams }: iAppProps) {
  const params = await employeeSearchParamsCache.parse(searchParams)
  const { data, meta } = await fetchEmployees(params)

  return <EmployeeTable data={data} meta={meta} />
}

export default function EmployeesPage({ searchParams }: iAppProps) {
  return (
    <Suspense fallback={<EmployeesLoading />}>
      <EmployeesContent searchParams={searchParams} />
    </Suspense>
  )
}
