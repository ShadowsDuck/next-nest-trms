'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Login, LoginSchema } from '@workspace/schemas'
import { Button, buttonVariants } from '@workspace/ui/components/button'
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
import { authClient } from '@/lib/auth-client'
import { API_URL } from '@/lib/constants'

export function LoginForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: Login) => {
    try {
      await authClient.signIn.email(data)

      toast.success('เข้าสู่ระบบสำเร็จ')
      router.push('/')
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
          <p className="text-sm text-muted-foreground">
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
                <p className="text-xs text-destructive">
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
                  className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
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
                <p className="text-xs text-destructive">
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
          <Link
            href={`${API_URL}/auth/google/login`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Image
              src="https://thesvg.org/icons/google/default.svg"
              alt="Google"
              width={18}
              height={18}
            />
            เข้าสู่ระบบด้วย Google
          </Link>

          <FieldDescription className="mt-2 text-center">
            ยังไม่มีบัญชี?{' '}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              สมัครสมาชิก
            </Link>
          </FieldDescription>
        </div>
      </FieldGroup>
    </form>
  )
}
