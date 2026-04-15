'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@workspace/ui/components/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { GoogleButton } from '@/components/google-button'
import { authClient } from '@/lib/auth-client'

const loginSchema = z.object({
  email: z.email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

type LoginType = z.infer<typeof loginSchema>

export function LoginForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset: formReset,
  } = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginType) => {
    try {
      await authClient.signIn.email(data, {
        onSuccess: () => {
          toast.success('เข้าสู่ระบบสำเร็จ')
          formReset()
          router.push('/')
        },
        onError: (ctx) => {
          if (ctx.error.status === 401) {
            toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
          } else {
            console.log(ctx.error)
            toast.error(ctx.error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
          }
        },
      })
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          <p className="text-muted-foreground text-sm">
            กรอกข้อมูลในฟอร์มด้านล่างเพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Email Field */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="email">อีเมล</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="กรุณากรอกอีเมล"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        {/* Password Field */}
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground ml-auto text-sm underline-offset-4 hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <Input
                {...field}
                id="password"
                type="password"
                placeholder="กรุณากรอกรหัสผ่าน"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              )}
            </Field>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </Button>

        <FieldSeparator>หรือดำเนินการต่อผ่าน</FieldSeparator>

        <div className="flex flex-col gap-2">
          <GoogleButton />

          <FieldDescription className="mt-2 text-center">
            ยังไม่มีบัญชี?{' '}
            <Link href="/sign-up" className="underline underline-offset-4">
              สมัครสมาชิก
            </Link>
          </FieldDescription>
        </div>
      </FieldGroup>
    </form>
  )
}
