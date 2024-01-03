export default function isDateInMonth (dateToCheck: Date, month: string) {
  const date = new Date(dateToCheck)
  const monthDate = new Date(month)

  if ((date.getUTCFullYear() === monthDate.getUTCFullYear()) &&
  date.getUTCMonth() === monthDate.getUTCMonth()) return true

  else return false
}