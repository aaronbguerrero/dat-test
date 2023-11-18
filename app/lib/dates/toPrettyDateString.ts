export default function toPrettyDateString (date: Date | undefined) {
  if (!date || date === undefined) return ''
  return date.toLocaleDateString('en-US', {timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric'})
}