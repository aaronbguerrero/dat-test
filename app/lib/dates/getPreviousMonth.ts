export default function getPreviousMonth (date: Date) {
  const previousMonth = new Date(date)
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1)
  
  return previousMonth
}