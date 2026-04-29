'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@workspace/ui/components/button'
import { ChevronLeft, RotateCcw, Save } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { createEmployee } from '@/domains/employees/actions'
import { EMPLOYEES_QUERY_KEY } from '../../options/query-options'
import { useOrganizationUnitOptions } from '../hooks/use-organization-unit-options'
import {
  type CreateEmployeeForm,
  createEmployeeSchema,
  defaultCreateEmployeeValues,
} from '../schemas/form-schema'
import { BasicInfoSection } from './basic-info-section'
import { EmploymentInfoSection } from './employment-info-section'
import { OrganizationUnitSection } from './organization-unit-section'

export function CreateEmployeePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const form = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: defaultCreateEmployeeValues,
  })

  const { handleSubmit, reset, setValue, formState } = form
  const orgUnitOptions = useOrganizationUnitOptions({
    control: form.control,
    setValue,
  })

  // รีเซ็ตฟอร์มกลับเป็นค่าเริ่มต้นทั้งหมด
  function handleResetForm() {
    reset(defaultCreateEmployeeValues)
    toast.success('ล้างฟอร์มเรียบร้อยแล้ว')
  }

  async function onSubmit(data: CreateEmployeeForm) {
    const payload = {
      employeeNo: data.employeeNo,
      prefix: data.prefix,
      firstName: data.firstName,
      lastName: data.lastName,
      idCardNo: data.idCardNo || undefined,
      hireDate: data.hireDate || undefined,
      jobLevel: data.jobLevel,
      status: data.status,
      plantId: data.plantId,
      buId: data.buId,
      functionId: data.functionId,
      divisionId: data.divisionId,
      departmentId: data.departmentId,
    }

    try {
      await createEmployee(payload)
      // ล้าง cache ของรายการพนักงานเพื่อให้ตารางดึงข้อมูลใหม่ทันที
      await queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })
      toast.success('สร้างพนักงานสำเร็จ')
      router.push('/admin/employees')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'สร้างพนักงานไม่สำเร็จ'
      )
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 bg-white pt-3 pb-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon-sm" asChild>
                <Link href="/admin/employees" aria-label="กลับไปหน้าพนักงาน">
                  <ChevronLeft data-icon="inline-start" />
                </Link>
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                เพิ่มพนักงาน
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              กรอกรายละเอียดเพื่อเพิ่มพนักงานใหม่เข้าระบบ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={handleResetForm}>
              <RotateCcw className="mr-1 size-4" data-icon="inline-start" />
              ล้างฟอร์ม
            </Button>
            <Button
              type="submit"
              form="create-employee-form"
              disabled={formState.isSubmitting}
              className="min-w-32"
            >
              <Save className="mr-1 size-4" data-icon="inline-start" />
              บันทึกพนักงาน
            </Button>
          </div>
        </div>
      </header>

      <FormProvider {...form}>
        <form
          id="create-employee-form"
          className="flex flex-col gap-5"
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
