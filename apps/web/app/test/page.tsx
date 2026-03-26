import { Suspense } from 'react'
import { Employee } from '@workspace/database'
import { AppBar } from '@/components/app-bar'
import { getEmployee } from '@/lib/actions'

async function EmployeesList() {
  const employees = await getEmployee()

  return (
    <ul className="list-disc pl-5">
      {employees.data.map((emp: Employee) => (
        <li key={emp.id} className="mb-2">
          <strong>{emp.prefix}</strong> : {emp.first_name} {emp.last_name}
          <span className="ml-2 text-gray-500">(ระดับ: {emp.job_level})</span>
          <span className="ml-2 text-gray-500">
            (วันที่เข้าทำงาน:{' '}
            {new Date(emp.hire_date || 'N/A').toLocaleDateString()})
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function TestPage() {
  return (
    <main>
      <AppBar />
      <div className="mx-auto max-w-7xl p-4">
        <h1 className="mb-4 text-2xl font-bold">รายชื่อพนักงาน</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <EmployeesList />
        </Suspense>
      </div>
    </main>
  )
}
