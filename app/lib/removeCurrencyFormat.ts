export default function removeCurrencyFormat (number: string) {
  let isNegative = false
  let hasSubUnits = false

  if (number.startsWith('-')) isNegative = true

  if (number.includes('.') || Number(number)) hasSubUnits = true

  let numberToParse = number
  if (number.endsWith('.', number.length - 1)) numberToParse = numberToParse + 0

  const parsedNumber = Number(numberToParse.replace(/[^0-9]+/g,""))

  if (!hasSubUnits) return isNegative ? -parsedNumber * 100 : parsedNumber * 100
  else return isNegative ? -parsedNumber : parsedNumber
}