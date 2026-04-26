import { DateTimePicker } from '@workspace/ui/components/date-picker'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { cn } from '@workspace/ui/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Controller, useFormContext } from 'react-hook-form'
import {
  jobLevelOptions,
  statusOptions,
} from '@/domains/employees'
import type { CreateEmployeeForm } from '../schemas/form-schema'
import { FormSectionShell } from './form-section-shell'

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
      step={2}
      title="ข้อมูลการจ้างงาน"
      description="ระบุระดับงาน สถานะ และวันที่เริ่มงาน"
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
              <Select
                key={field.value ?? 'empty-job-level'}
                value={field.value}
                onValueChange={field.onChange}
              >
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
              <div
                id="status"
                role="radiogroup"
                aria-invalid={fieldState.invalid}
                className={cn(
                  'bg-muted grid h-10 grid-cols-2 rounded-md border p-1',
                  fieldState.invalid && 'border-destructive'
                )}
              >
                {statusOptions.map((option) => {
                  const isActive = field.value === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={cn(
                        'rounded-sm text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-background text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => {
                        field.onChange(option.value)
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
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
