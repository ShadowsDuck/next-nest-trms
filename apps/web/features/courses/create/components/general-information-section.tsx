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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { cn } from '@workspace/ui/lib/utils'
import { Controller, useFormContext } from 'react-hook-form'
import { courseTypeOptions } from '@/domains/courses'
import type { CreateCourseForm } from '../schemas/form-schema'
import { FormSectionShell } from './form-section-shell'

type GeneralInformationSectionProps = {
  tagOptions: Array<{ id: string; name: string }>
}

// แสดงฟอร์มข้อมูลพื้นฐานของหลักสูตร เช่น ชื่อ หมวดหมู่ และประเภท
export function GeneralInformationSection({
  tagOptions,
}: GeneralInformationSectionProps) {
  const { control } = useFormContext<CreateCourseForm>()

  return (
    <FormSectionShell
      step={1}
      title="ข้อมูลทั่วไป"
      description="กรอกรายละเอียดพื้นฐานของหลักสูตร"
    >
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="title" className="flex items-center gap-1">
                <p>ชื่อหลักสูตร</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...field}
                id="title"
                placeholder="เช่น หลักสูตรภาวะผู้นำ"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="tagId"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="tagId" className="flex items-center gap-1">
                <p>หมวดหมู่หลักสูตร</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="tagId"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent position="popper" className="p-1">
                  {tagOptions.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="type" className="flex items-center gap-1">
                <p>ประเภทหลักสูตร</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <div
                id="type"
                role="radiogroup"
                aria-invalid={fieldState.invalid}
                className={cn(
                  'bg-muted grid h-10 grid-cols-2 rounded-md border p-1',
                  fieldState.invalid && 'border-destructive'
                )}
              >
                {courseTypeOptions.map((option) => {
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
      </FieldGroup>
    </FormSectionShell>
  )
}
