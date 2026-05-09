import * as z from 'zod'

// ฟิลด์ email มาตรฐานสำหรับฟอร์ม Auth ทุกประเภท
export const emailField = z.email('รูปแบบอีเมลไม่ถูกต้อง')

// ฟิลด์ password สำหรับ Login (ตรวจแค่ไม่ว่าง)
export const loginPasswordField = z.string().min(1, 'กรุณากรอกรหัสผ่าน')

// ฟิลด์ password สำหรับ Signup (ตรวจ format ความปลอดภัยเต็มรูปแบบ)
export const signupPasswordField = z
  .string()
  .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
  .regex(/[a-zA-Z]/, 'รหัสผ่านต้องมีตัวอักษร')
  .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลข')
  .regex(/[^a-zA-Z0-9]/, 'รหัสผ่านต้องมีตัวอักษรพิเศษ')
  .trim()
