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
import { BriefcaseBusiness } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import {
  jobLevelOptions,
  statusOptions,
} from '@/features/employees/lib/filter-options'
import { FormSectionShell } from '@/features/new-employee/components/form-section-shell'
import type { CreateEmployeeForm } from '@/features/new-employee/lib/create-employee-schema'

export function EmploymentInfoSection() {
  const { control } = useFormContext<CreateEmployeeForm>()

  return (
    <FormSectionShell
      icon={<BriefcaseBusiness />}
      title="ข้อมูลการจ้างงาน"
      description="กำหนดระดับงาน สถานะ และวันที่เริ่มงาน"
    >
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="jobLevel"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="jobLevel"
                className="flex items-center gap-1"
              >
                <p>ระดับงาน</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="jobLevel"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="เลือกระดับงาน" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {jobLevelOptions.map((option) => (
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
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="status" className="flex items-center gap-1">
                <p>สถานะ</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="status"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {statusOptions.map((option) => (
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
          name="hireDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="hireDate">วันที่จ้างงาน</FieldLabel>
              <Input
                {...field}
                id="hireDate"
                type="date"
                value={field.value ?? ''}
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
