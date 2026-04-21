import { accreditationStatus, courseType } from '@workspace/schemas'

export const courseTypeOptions = [
  { label: 'ภายใน', value: 'Internal' },
  { label: 'ภายนอก', value: 'External' },
] satisfies { label: string; value: (typeof courseType)[number] }[]

export const accreditationStatusOptions = [
  { label: 'รอกระบวนการ', value: 'Pending' },
  { label: 'อนุมัติแล้ว', value: 'Approved' },
  { label: 'ปฏิเสธ', value: 'Rejected' },
] satisfies { label: string; value: (typeof accreditationStatus)[number] }[]
