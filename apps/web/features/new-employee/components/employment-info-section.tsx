import { DateTimePicker } from '@workspace/ui/components/date-picker'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
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
} from '@/domains/employees/lib/filter-options'
import { FormSectionShell } from './form-section-shell'
import type { CreateEmployeeForm } from './new-employee-page'

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

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

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
              <DateTimePicker
                value={parseIsoDate(field.value)}
                onChange={(date) => {
                  field.onChange(date ? toIsoDate(date) : '')
                }}
                placeholder="เลือกวันที่จ้างงาน"
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
      </FieldGroup>
    </FormSectionShell>
  )
}
