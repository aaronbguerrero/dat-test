export default async function setMonthData (month: string) {
  const response = await fetch(`/api/months/setMonthData`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      month: month,
    })
  })
  .then(response => response.json())

  return response
}