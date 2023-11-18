export default function getDaysInMonth(date: string) {
  const originalDate = new Date(date)
  
  const daysInMonth = new Date(Date.UTC(originalDate.getUTCFullYear(), originalDate.getUTCMonth() + 1, 0)).getUTCDate()

  return daysInMonth
}