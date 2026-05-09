// แปลง timestamp (milliseconds) จาก query params ให้เป็น Date ที่ Prisma ใช้งานได้อย่างปลอดภัย
export function parseTimestamp(value: unknown): Date | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// แปลง Date ให้เป็น string ISO format (รวมเวลา)
export function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

// แปลง Date ให้เป็น string ISO format (เฉพาะวันที่ YYYY-MM-DD)
export function toIsoDate(value: Date | null): string | null {
  return value ? value.toISOString().split('T')[0] : null;
}
