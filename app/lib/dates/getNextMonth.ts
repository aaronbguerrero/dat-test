export default function getNextMonth (date: Date) {
  const nextMonth = new Date(date)
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)
  
  return nextMonth
}