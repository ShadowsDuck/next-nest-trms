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
import { UserRound } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { prefixOptions } from '@/features/employees/lib/filter-options'
import { FormSectionShell } from '@/features/new-employee/components/form-section-shell'
import type { CreateEmployeeForm } from '@/features/new-employee/components/new-employee-page'

export function BasicInfoSection() {
  const { control } = useFormContext<CreateEmployeeForm>()

  return (
    <FormSectionShell
      icon={<UserRound />}
      title="ข้อมูลเบื้องต้น"
      description="ระบุข้อมูลส่วนตัวเบื้องต้นของพนักงานให้ครบถ้วน"
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
