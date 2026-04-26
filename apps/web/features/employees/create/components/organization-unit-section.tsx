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
import { cn } from '@workspace/ui/lib/utils'
import { Controller, useFormContext } from 'react-hook-form'
import type { OrganizationOption } from '@/domains/org-units'
import type { CreateEmployeeForm } from '../schemas/form-schema'
import { FormSectionShell } from './form-section-shell'

type OrganizationUnitSectionProps = {
  plantOptions: OrganizationOption[]
  buOptions: OrganizationOption[]
  functionOptions: OrganizationOption[]
  divisionOptions: OrganizationOption[]
  departmentOptions: OrganizationOption[]
  isOrgLoading: boolean
  selectedPlantId?: string
  selectedBuId?: string
  selectedFunctionId?: string
  selectedDivisionId?: string
}

export function OrganizationUnitSection({
  plantOptions,
  buOptions,
  functionOptions,
  divisionOptions,
  departmentOptions,
  isOrgLoading,
  selectedPlantId,
  selectedBuId,
  selectedFunctionId,
  selectedDivisionId,
}: OrganizationUnitSectionProps) {
  const { control, setValue } = useFormContext<CreateEmployeeForm>()

  return (
    <FormSectionShell
      step={3}
      title="หน่วยงานต้นสังกัด"
      description="เลือกหน่วยงานตามลำดับโครงสร้างองค์กร"
    >
      <div
        className={cn(
          'transition-opacity duration-200',
          isOrgLoading && 'pointer-events-none opacity-70 select-none'
        )}
        aria-busy={isOrgLoading}
      >
        <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="plantId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel
                  htmlFor="plantId"
                  className="flex items-center gap-1"
                >
                  <p>โรงงาน (Plant)</p>
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    setValue('buId', '')
                    setValue('functionId', '')
                    setValue('divisionId', '')
                    setValue('departmentId', '')
                  }}
                >
                  <SelectTrigger
                    id="plantId"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="เลือกโรงงาน" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {plantOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
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
            name="buId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="buId" className="flex items-center gap-1">
                  <p>หน่วยธุรกิจ (BU)</p>
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    setValue('functionId', '')
                    setValue('divisionId', '')
                    setValue('departmentId', '')
                  }}
                  disabled={!selectedPlantId}
                >
                  <SelectTrigger
                    id="buId"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="เลือกหน่วยธุรกิจ" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {buOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
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
            name="functionId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel
                  htmlFor="functionId"
                  className="flex items-center gap-1"
                >
                  <p>สายงาน</p>
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    setValue('divisionId', '')
                    setValue('departmentId', '')
                  }}
                  disabled={!selectedBuId}
                >
                  <SelectTrigger
                    id="functionId"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="เลือกสายงาน" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {functionOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
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
            name="divisionId"
            control={control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel
                  htmlFor="divisionId"
                  className="flex items-center gap-1"
                >
                  <p>ฝ่าย</p>
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    setValue('departmentId', '')
                  }}
                  disabled={!selectedFunctionId}
                >
                  <SelectTrigger
                    id="divisionId"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="เลือกฝ่าย" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {divisionOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
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
            name="departmentId"
            control={control}
            render={({ field, fieldState }) => (
              <Field className="md:col-span-2">
                <FieldLabel
                  htmlFor="departmentId"
                  className="flex items-center gap-1"
                >
                  <p>แผนก</p>
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedDivisionId}
                >
                  <SelectTrigger
                    id="departmentId"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="เลือกแผนก" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {departmentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
      </div>
    </FormSectionShell>
  )
}
