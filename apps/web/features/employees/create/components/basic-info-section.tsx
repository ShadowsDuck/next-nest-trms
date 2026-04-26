import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Controller, useFormContext } from 'react-hook-form'
import { prefixOptions } from '@/domains/employees'
import type { CreateEmployeeForm } from '../schemas/form-schema'
import { FormSectionShell } from './form-section-shell'

export function BasicInfoSection() {
  const { control } = useFormContext<CreateEmployeeForm>()

  return (
    <FormSectionShell
      step={1}
      title="ข้อมูลพื้นฐาน"
      description="กรอกข้อมูลส่วนตัวพื้นฐานของพนักงาน"
    >
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="employeeNo"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="employeeNo"
                className="flex items-center gap-1"
              >
                <p>รหัสพนักงาน</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="employeeNo"
                placeholder="เช่น EMP017"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="prefix"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="prefix" className="flex items-center gap-1">
                <p>คำนำหน้า</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="prefix"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="เลือกคำนำหน้า" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {prefixOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="firstName"
                className="flex items-center gap-1"
              >
                <p>ชื่อ</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="firstName"
                placeholder="ชื่อพนักงาน"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="lastName"
                className="flex items-center gap-1"
              >
                <p>นามสกุล</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="lastName"
                placeholder="นามสกุลพนักงาน"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="idCardNo"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="idCardNo">เลขบัตรประชาชน</FieldLabel>
              <Input
                {...field}
                id="idCardNo"
                placeholder="13 หลัก"
                maxLength={13}
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
