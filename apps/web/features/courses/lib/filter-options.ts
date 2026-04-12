import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'

export const prefixOptions = [
  { label: 'นาย', value: 'Mr' },
  { label: 'นาง', value: 'Mrs' },
  { label: 'นางสาว', value: 'Miss' },
] satisfies { label: string; value: (typeof prefix)[number] }[]

export const jobLevelOptions = jobLevel.map((value) => ({
  label: value,
  value,
}))

export const statusOptions = [
  { label: 'ทำงาน', value: 'Active' },
  { label: 'ลาออก', value: 'Resigned' },
] satisfies { label: string; value: (typeof employeeStatus)[number] }[]
