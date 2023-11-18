export default function toMonthString (date: Date) {
  return date.toISOString().substring(0,7)
}