export default function getCurrentMonth () {
  const currentMonth = new Date()
  currentMonth.setUTCDate(1)
  currentMonth.setUTCHours(0,0,0,0)

  return currentMonth
}