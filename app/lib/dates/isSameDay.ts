export function isSameDay (day1: Date, day2: Date): boolean {
  return day1.getUTCFullYear() === day2.getUTCFullYear() &&
    day1.getUTCMonth() === day2.getUTCMonth() &&
    day1.getUTCDate() === day2.getUTCDate() 
}