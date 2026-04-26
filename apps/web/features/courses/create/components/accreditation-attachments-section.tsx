import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { UploadCloud } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { accreditationStatusOptions } from '@/domains/courses'
import type { CreateCourseForm } from '../schemas/form-schema'
import { FormSectionShell } from './form-section-shell'

type FileDropZoneProps = {
  id: string
  label: string
  value?: string
  onChange: (value: string) => void
}

// แสดงกล่องเลือกไฟล์และบันทึกค่าเป็น path/filename string ในฟอร์ม
function FileDropZone({ id, label, value, onChange }: FileDropZoneProps) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <label
        htmlFor={id}
        className="hover:bg-muted/50 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-center transition-colors"
      >
        <UploadCloud className="text-muted-foreground size-5" />
        <p className="text-sm text-slate-700">
          {value ? 'เปลี่ยนไฟล์ที่เลือก' : 'คลิกเพื่อเลือกไฟล์แนบ'}
        </p>
        <p className="text-muted-foreground text-xs">
          {value || 'ยังไม่ได้เลือกไฟล์'}
        </p>
      </label>
      <input
        id={id}
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          onChange(`uploads/courses/${file.name}`)
        }}
      />
    </div>
  )
}

// แสดงฟอร์มสถานะการรับรองและข้อมูลไฟล์แนบของหลักสูตร
export function AccreditationAttachmentsSection() {
  const { control } = useFormContext<CreateCourseForm>()

  return (
    <FormSectionShell
      step={4}
      title="การรับรองและเอกสารแนบ"
      description="กำหนดสถานะการรับรองและไฟล์เอกสารที่เกี่ยวข้อง"
    >
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Controller
          name="accreditationStatus"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel
                htmlFor="accreditationStatus"
                className="flex items-center gap-1"
              >
                <p>สถานะการรับรอง</p>
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="accreditationStatus"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent position="popper" className="p-1">
                  {accreditationStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="accreditationFilePath"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FileDropZone
                id="accreditationFilePath"
                label="ไฟล์รับรอง"
                value={field.value}
                onChange={field.onChange}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="attendanceFilePath"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FileDropZone
                id="attendanceFilePath"
                label="ไฟล์รายชื่อผู้เข้าอบรม"
                value={field.value}
                onChange={field.onChange}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </FormSectionShell>
  )
}
