/**
 * Parse a stored date string as local time.
 * Date-only strings (YYYY-MM-DD) are parsed as UTC by `new Date()`, which
 * causes off-by-one-day display errors in negative UTC offset timezones.
 * Appending T00:00:00 (no Z) makes the browser treat it as local midnight.
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  if (!dateStr.includes('T')) return new Date(dateStr + 'T00:00:00')
  return new Date(dateStr)
}
