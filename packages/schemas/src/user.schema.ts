import * as z from "zod"

export const UserRoleEnum = z.enum(["ADMIN", "MANAGER", "EMPLOYEE"])

export const UserSchema = z.object({
  id: z.cuid(),
  employee_id: z.cuid().nullable().optional(),
  email: z.email(),
  password: z.string().nullable().optional(),
  role: UserRoleEnum.default("EMPLOYEE"),
  refresh_token: z.string().nullable().optional(),
  google_id: z.string().nullable().optional(),
  picture: z.string().nullable().optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

// Register schema
export const RegisterSchema = z
  .object({
    email: z.email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      .regex(/[a-zA-Z]/, "รหัสผ่านต้องมีตัวอักษร")
      .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลข")
      .regex(/[^a-zA-Z0-9]/, "รหัสผ่านต้องมีตัวอักษรพิเศษ")
      .trim(),
  })
  .meta({
    example: {
      email: "test@example.com",
      password: "Password@123",
    },
  })

// Login user schema
export const LoginSchema = z
  .object({
    email: z.email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  })
  .meta({
    example: {
      email: "test@example.com",
      password: "Password@123",
    },
  })

export type Login = z.infer<typeof LoginSchema>

// User response schema
export const UserResponseSchema = UserSchema.omit({
  password: true,
  refresh_token: true,
})
