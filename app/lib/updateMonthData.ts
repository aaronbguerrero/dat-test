export default async function updateMonthData (month: string) {
  const response = await fetch(`/api/months/setMonthData/${month}`)
  .then(response => response.json())

  return response
}

//TODO: Change to setMonthData