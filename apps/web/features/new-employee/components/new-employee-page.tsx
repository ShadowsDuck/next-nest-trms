'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@workspace/ui/components/button'
import { ChevronLeft } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { BasicInfoSection } from '@/features/new-employee/components/basic-info-section'
import { EmploymentInfoSection } from '@/features/new-employee/components/employment-info-section'
import { OrganizationUnitSection } from '@/features/new-employee/components/organization-unit-section'
import { createEmployee } from '@/features/new-employee/data/create-employee'
import { useOrganizationUnitOptions } from '@/features/new-employee/hooks/use-organization-unit-options'
import {
  type CreateEmployeeForm,
  createEmployeeSchema,
  defaultCreateEmployeeValues,
} from '@/features/new-employee/lib/create-employee-schema'

export function NewEmployeePage() {
  const router = useRouter()
  const form = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: defaultCreateEmployeeValues,
  })

  const { handleSubmit, reset, setValue, formState } = form
  const orgUnitOptions = useOrganizationUnitOptions({
    control: form.control,
    setValue,
  })

  function handleResetForm() {
    reset(defaultCreateEmployeeValues)
    toast.success('ล้างฟอร์มเรียบร้อยแล้ว')
  }

  async function onSubmit(data: CreateEmployeeForm) {
    const payloadForSelfRelation = {
      employeeNo: data.employeeNo,
      prefix: data.prefix,
      firstName: data.firstName,
      lastName: data.lastName,
      idCardNo: data.idCardNo || undefined,
      hireDate: data.hireDate || undefined,
      jobLevel: data.jobLevel,
      status: data.status,
      orgUnitId: data.departmentId,
    }

    try {
      await createEmployee(payloadForSelfRelation)
      toast.success('สร้างพนักงานสำเร็จ')
      router.push('/admin/employees')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'สร้างพนักงานไม่สำเร็จ'
      )
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-5 pt-2 pb-4">
      <header className="flex gap-3">
        <Button variant="outline" size="icon-sm" asChild>
          <Link href="/admin/employees">
            <ChevronLeft data-icon="inline-start" />
          </Link>
        </Button>
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              เพิ่มข้อมูลพนักงานใหม่
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={handleResetForm}>
              ล้างฟอร์ม
            </Button>
            <Button
              type="submit"
              form="create-employee-form"
              disabled={formState.isSubmitting}
            >
              สร้างพนักงาน
            </Button>
          </div>
        </div>
      </header>

      <FormProvider {...form}>
        <form
          id="create-employee-form"
          className="mt-5 flex flex-col gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <BasicInfoSection />
          <EmploymentInfoSection />
          <OrganizationUnitSection {...orgUnitOptions} />
        </form>
      </FormProvider>
    </div>
  )
}
