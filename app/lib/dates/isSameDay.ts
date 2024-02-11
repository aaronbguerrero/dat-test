export function isSameDay (day1: Date | undefined, day2: Date | undefined): boolean {
  if (day1 === undefined || day2 === undefined) return false
  
  return day1.getUTCFullYear() === day2.getUTCFullYear() &&
    day1.getUTCMonth() === day2.getUTCMonth() &&
    day1.getUTCDate() === day2.getUTCDate() 
}