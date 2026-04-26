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

// แสดงฟอร์มข้อมูลผู้สอน หน่วยงานผู้จัด และค่าใช้จ่ายหลักสูตร
export function InstructorCostSection() {
  const { control } = useFormContext<CreateCourseForm>()

  return (
    <FormSectionShell
      step={3}
      title="ผู้สอนและค่าใช้จ่าย"
      description="ระบุผู้รับผิดชอบหลักสูตรและงบประมาณ"
    >
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Controller
          name="lecturer"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="lecturer">วิทยากร / ผู้สอน</FieldLabel>
              <Input
                {...field}
                id="lecturer"
                placeholder="เช่น สมชาย ใจดี"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="institute"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="institute">สถาบัน / ผู้จัด</FieldLabel>
              <Input
                {...field}
                id="institute"
                placeholder="เช่น Acme Training Institute"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="expense"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="expense" className="flex items-center gap-1">
                <p>ค่าใช้จ่าย (บาท)</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="expense"
                type="number"
                min={0}
                step={0.01}
                value={field.value}
                onChange={field.onChange}
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
