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
              <Input
                {...field}
                id="startDate"
                type="date"
                aria-invalid={fieldState.invalid}
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
              <Input
                {...field}
                id="endDate"
                type="date"
                aria-invalid={fieldState.invalid}
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
