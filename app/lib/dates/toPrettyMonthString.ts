export default function toPrettyMonthString (date: Date) {
  return date.toLocaleString("en-us", { month: 'long', year: 'numeric', timeZone: 'UTC' })
}