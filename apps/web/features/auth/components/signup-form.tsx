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

const signupSchema = z
  .object({
    email: z.email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z
      .string()
      .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
      .regex(/[a-zA-Z]/, 'รหัสผ่านต้องมีตัวอักษร')
      .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลข')
      .regex(/[^a-zA-Z0-9]/, 'รหัสผ่านต้องมีตัวอักษรพิเศษ')
      .trim(),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

type SignupType = z.infer<typeof signupSchema>

export function SignupForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset: formReset,
  } = useForm<SignupType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignupType) => {
    try {
      await authClient.signUp.email(
        {
          email: data.email,
          password: data.password,
          name: '',
        },
        {
          onSuccess: () => {
            toast.success('สมัครสมาชิกสำเร็จ')
            formReset()
            router.push('/')
          },
          onError: (ctx) => {
            if (ctx.error.status === 422) {
              toast.error('อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น')
            } else {
              toast.error(ctx.error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
            }
          },
        }
      )
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
          <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
          <p className="text-sm text-muted-foreground">
            กรอกข้อมูลในฟอร์มด้านล่างเพื่อสมัครสมาชิก
          </p>
        </div>

        {/* Email */}
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

        {/* Password */}
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => {
            const passwordValue = field.value || ''

            const requirements = [
              { label: 'อย่างน้อย 8 ตัวอักษร', met: passwordValue.length >= 8 },
              {
                label: 'ต้องมีตัวอักษร (A-Z)',
                met: /[a-zA-Z]/.test(passwordValue),
              },
              { label: 'ต้องมีตัวเลข (0-9)', met: /[0-9]/.test(passwordValue) },
              {
                label: 'ต้องมีอักขระพิเศษ (@, #, !, %)',
                met: /[^a-zA-Z0-9]/.test(passwordValue),
              },
            ]

            return (
              <Field>
                <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  placeholder="กรุณากรอกรหัสผ่าน"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <p className="mt-2 text-xs font-semibold text-destructive">
                    {fieldState.error.message}
                  </p>
                )}

                <div className="space-y-1.5">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-colors',
                          req.met ? 'bg-green-500' : 'bg-muted-foreground/30'
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs transition-colors',
                          req.met
                            ? 'font-medium text-green-600'
                            : 'text-muted-foreground'
                        )}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Field>
            )
          }}
        />

        {/* Confirm Password */}
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="confirm-password">ยืนยันรหัสผ่าน</FieldLabel>
              <Input
                {...field}
                id="confirm-password"
                type="password"
                placeholder="กรุณากรอกรหัสผ่านอีกครั้ง"
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
              <span>กำลังสมัครสมาชิก...</span>
            </>
          ) : (
            'สมัครสมาชิก'
          )}
        </Button>

        <FieldSeparator>หรือดำเนินการต่อผ่าน</FieldSeparator>

        <Field>
          <GoogleButton />

          <FieldDescription className="px-6 text-center">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="underline">
              เข้าสู่ระบบ
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
