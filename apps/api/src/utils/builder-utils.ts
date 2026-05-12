// แปลงค่า unknown ให้เป็น number โดยตรวจสอบความถูกต้องก่อนใช้งาน
export function parseNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  return value;
}
