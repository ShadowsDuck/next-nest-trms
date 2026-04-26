import { accreditationStatus, courseType } from '@workspace/schemas'
import * as z from 'zod'

// เปรียบเทียบเวลาแบบ HH:mm หรือ HH:mm:ss เพื่อใช้ตรวจลำดับเวลา
function toSecond(value: string) {
  const [hourText = '0', minuteText = '0', secondText = '0'] = value.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)

  return hour * 3600 + minute * 60 + second
}

export const createCourseFormSchema = z
  .object({
    title: z.string().min(1, 'กรุณากรอกชื่อหลักสูตร'),
    tagId: z.string().min(1, 'กรุณาเลือกหมวดหมู่หลักสูตร'),
    type: z.enum(courseType, { message: 'กรุณาเลือกประเภทหลักสูตร' }),
    startDate: z.string().min(1, 'กรุณาเลือกวันที่เริ่มต้น'),
    endDate: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุด'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    duration: z
      .string()
      .min(1, 'กรุณากรอกระยะเวลา')
      .refine(
        (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
        'ระยะเวลาต้องมากกว่าหรือเท่ากับ 0'
      ),
    lecturer: z.string().optional(),
    institute: z.string().optional(),
    expense: z
      .string()
      .min(1, 'กรุณากรอกค่าใช้จ่าย')
      .refine(
        (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
        'ค่าใช้จ่ายต้องมากกว่าหรือเท่ากับ 0'
      ),
    accreditationStatus: z.enum(accreditationStatus, {
      message: 'กรุณาเลือกสถานะการรับรอง',
    }),
    accreditationFilePath: z.string().optional(),
    attendanceFilePath: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น',
      })
    }

    if (
      value.startDate &&
      value.endDate &&
      value.startDate === value.endDate &&
      value.startTime &&
      value.endTime &&
      toSecond(value.startTime) > toSecond(value.endTime)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'เวลาเริ่มต้องไม่มากกว่าเวลาสิ้นสุดเมื่อเป็นวันเดียวกัน',
      })
    }
  })

export type CreateCourseForm = z.infer<typeof createCourseFormSchema>

export const defaultCreateCourseValues: CreateCourseForm = {
  title: '',
  tagId: '',
  type: 'Internal',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  duration: '0',
  lecturer: '',
  institute: '',
  expense: '0',
  accreditationStatus: 'Pending',
  accreditationFilePath: '',
  attendanceFilePath: '',
}
