import * as z from 'zod'

export const createEmployeeSchema = z.object({
  employeeNo: z.string().min(1, 'กรุณากรอกรหัสพนักงาน'),
  prefix: z.enum(['Mr', 'Mrs', 'Miss'], { message: 'กรุณาเลือกคำนำหน้า' }),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  idCardNo: z
    .string()
    .regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก')
    .or(z.literal('')),
  hireDate: z.string().optional(),
  jobLevel: z.enum(['S1', 'S2', 'M1', 'M2'], {
    message: 'กรุณาเลือกระดับงาน',
  }),
  status: z.enum(['Active', 'Resigned'], { message: 'กรุณาเลือกสถานะ' }),
  plantId: z.string().min(1, 'กรุณาเลือก Plant'),
  buId: z.string().min(1, 'กรุณาเลือก Business Unit'),
  functionId: z.string().min(1, 'กรุณาเลือก Function'),
  divisionId: z.string().min(1, 'กรุณาเลือก Division'),
  departmentId: z.string().min(1, 'กรุณาเลือก Department'),
})

export type CreateEmployeeForm = z.infer<typeof createEmployeeSchema>

export const defaultCreateEmployeeValues: Partial<CreateEmployeeForm> = {
  employeeNo: '',
  prefix: undefined,
  firstName: '',
  lastName: '',
  idCardNo: '',
  hireDate: '',
  jobLevel: undefined,
  status: 'Active',
  plantId: '',
  buId: '',
  functionId: '',
  divisionId: '',
  departmentId: '',
}
