export function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

export function toIsoDate(value: Date | null): string | null {
  return value ? value.toISOString().split('T')[0] : null;
}
