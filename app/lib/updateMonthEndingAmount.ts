export default async function updateMonthEndingAmount (month: string) {
  const response = await fetch(`/api/months/setMonthEndingAmount/${month}`)
  .then(response => response.json())

  return response
}