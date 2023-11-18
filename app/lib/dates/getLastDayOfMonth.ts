export default function getLastDayOfMonth(date: Date) {
  const originalDate = new Date(date)
  const lastDay = new Date(originalDate.getUTCFullYear(), originalDate.getUTCMonth() + 1, 0)

  return lastDay
}