import { DateTimePicker } from '@workspace/ui/components/date-picker'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import { Controller, useFormContext } from 'react-hook-form'
import type { CreateCourseForm } from '../schemas/form-schema'
import { FormSectionShell } from './form-section-shell'

// แปลงวันที่รูปแบบ ISO (yyyy-MM-dd) ให้เป็น Date สำหรับแสดงผลในตัวเลือกวันที่
function parseIsoDate(value?: string) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

// แปลงค่า Date จากตัวเลือกวันที่กลับเป็นสตริงรูปแบบ ISO (yyyy-MM-dd)
function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// แสดงฟอร์มกำหนดช่วงวัน เวลา และระยะเวลาการอบรมของหลักสูตร
export function ScheduleDetailsSection() {
  const { control } = useFormContext<CreateCourseForm>()

  return (
    <FormSectionShell
      step={2}
      title="กำหนดการและรายละเอียด"
      description="ระบุวันที่ เวลา และระยะเวลาหลักสูตร"
    >
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Controller
          name="startDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="startDate"
                className="flex items-center gap-1"
              >
                <p>วันที่เริ่ม</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <DateTimePicker
                value={parseIsoDate(field.value)}
                onChange={(date) => {
                  field.onChange(date ? toIsoDate(date) : '')
                }}
                placeholder="เลือกวันที่เริ่ม"
                granularity="day"
                className={
                  fieldState.invalid ? 'border-destructive' : undefined
                }
                displayFormat={{ hour24: 'dd/MM/yyyy' }}
                buddhist
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="endDate" className="flex items-center gap-1">
                <p>วันที่สิ้นสุด</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <DateTimePicker
                value={parseIsoDate(field.value)}
                onChange={(date) => {
                  field.onChange(date ? toIsoDate(date) : '')
                }}
                placeholder="เลือกวันที่สิ้นสุด"
                granularity="day"
                className={
                  fieldState.invalid ? 'border-destructive' : undefined
                }
                displayFormat={{ hour24: 'dd/MM/yyyy' }}
                buddhist
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="duration"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="duration"
                className="flex items-center gap-1"
              >
                <p>ระยะเวลา (ชั่วโมง)</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="duration"
                type="number"
                min={0}
                step={0.5}
                value={field.value}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="startTime"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="startTime">เวลาเริ่ม</FieldLabel>
              <Input
                {...field}
                id="startTime"
                type="time"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="endTime"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="endTime">เวลาสิ้นสุด</FieldLabel>
              <Input
                {...field}
                id="endTime"
                type="time"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </FormSectionShell>
  )
}
