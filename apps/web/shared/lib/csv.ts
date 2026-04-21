/**
 * Trigger CSV download in browser.
 */
export function triggerCsvDownload(filename: string, rows: string[]) {
  const csvContent = rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape a cell value for CSV output.
 * Handles strings, numbers, booleans, dates, arrays, null, and undefined.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (value instanceof Date) {
    return `"${value.toISOString()}"`
  }

  if (Array.isArray(value)) {
    const joined = value.map(String).join(', ')
    return `"${joined.replace(/"/g, '""')}"`
  }

  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)

  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
