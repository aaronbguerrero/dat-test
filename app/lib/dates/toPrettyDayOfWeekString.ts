export default function toPrettyDayOfWeekString (date: Date | undefined) {
  if (!date || date === undefined) return ''
  return date.toLocaleDateString('en-US', {timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric'})
}