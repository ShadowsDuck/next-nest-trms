'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@workspace/ui/components/button'
import { ChevronLeft, RotateCcw, Save } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { createCourse } from '@/domains/courses'
import { useTagOptions } from '../hooks/use-tag-options'
import {
  type CreateCourseForm,
  createCourseFormSchema,
  defaultCreateCourseValues,
} from '../schemas/form-schema'
import { AccreditationAttachmentsSection } from './accreditation-attachments-section'
import { GeneralInformationSection } from './general-information-section'
import { InstructorCostSection } from './instructor-cost-section'
import { ScheduleDetailsSection } from './schedule-details-section'

// แปลงค่าเวลา HH:mm เป็น HH:mm:ss สำหรับ payload ที่ส่งเข้า API
function normalizeTime(value?: string) {
  if (!value) {
    return undefined
  }

  if (value.length === 5) {
    return `${value}:00`
  }

  return value
}

// แสดงหน้าเพิ่มหลักสูตรใหม่และจัดการการบันทึกข้อมูลหลักสูตร
export function CreateCoursePage() {
  const router = useRouter()
  const { data: tagOptions = [] } = useTagOptions()
  const form = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: defaultCreateCourseValues,
  })

  const { handleSubmit, reset, formState } = form

  // รีเซ็ตฟอร์มกลับเป็นค่าเริ่มต้นทั้งหมด
  function handleResetForm() {
    reset(defaultCreateCourseValues)
    toast.success('ล้างฟอร์มเรียบร้อยแล้ว')
  }

  // ส่งข้อมูลฟอร์มไปสร้างหลักสูตรใหม่ที่ฝั่ง API
  async function onSubmit(data: CreateCourseForm) {
    const payload = {
      title: data.title,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: normalizeTime(data.startTime),
      endTime: normalizeTime(data.endTime),
      duration: Number(data.duration),
      lecturer: data.lecturer || undefined,
      institute: data.institute || undefined,
      expense: Number(data.expense),
      accreditationStatus: data.accreditationStatus,
      accreditationFilePath: data.accreditationFilePath || undefined,
      attendanceFilePath: data.attendanceFilePath || undefined,
      tagId: data.tagId,
    } as const

    try {
      await createCourse(payload)
      toast.success('สร้างหลักสูตรสำเร็จ')
      router.push('/admin/courses')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'สร้างหลักสูตรไม่สำเร็จ'
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
                <Link href="/admin/courses" aria-label="กลับไปหน้าหลักสูตร">
                  <ChevronLeft data-icon="inline-start" />
                </Link>
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                เพิ่มหลักสูตรใหม่
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              กรอกรายละเอียดเพื่อสร้างหลักสูตรใหม่ในระบบ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={handleResetForm}>
              <RotateCcw className="mr-1 size-4" data-icon="inline-start" />
              ล้างฟอร์ม
            </Button>
            <Button
              type="submit"
              form="create-course-form"
              disabled={formState.isSubmitting}
              className="min-w-32"
            >
              <Save className="mr-1 size-4" data-icon="inline-start" />
              บันทึกหลักสูตร
            </Button>
          </div>
        </div>
      </header>

      <FormProvider {...form}>
        <form
          id="create-course-form"
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <GeneralInformationSection tagOptions={tagOptions} />
          <ScheduleDetailsSection />
          <InstructorCostSection />
          <AccreditationAttachmentsSection />
        </form>
      </FormProvider>
    </div>
  )
}
