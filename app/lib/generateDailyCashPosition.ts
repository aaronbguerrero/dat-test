import type { Transaction } from '../types'
import type { MonthData } from '../types'
import Dinero from 'dinero.js'
import getDaysInMonth from './dates/getDaysInMonth'

export default function generateDailyCashPosition (
  transactions: Transaction[] | undefined, month: MonthData
):Dinero.Dinero[] {
  //Setup array with a baseline of 0 change for each day
  const cashFlowModifiers: Dinero.Dinero[] = new Array(getDaysInMonth(month.month) + 1)
  .fill(Dinero({ amount: 0, currency: month.startingAmount.currency }))

  //If data needed isn't there, return no change for entire month
  if ((!month.startingAmount) || (!transactions)) return cashFlowModifiers
  
  //Add/subtract each transaction's amount on the appropriate day
  transactions.forEach((transaction) => {
    const index = new Date(transaction.date).getUTCDate()
    const existingModifier = cashFlowModifiers[index]

    cashFlowModifiers.splice(
      index, 
      1, 
      (Dinero({
        amount: existingModifier?.getAmount() + transaction.amount.amount,
        currency: transaction.amount.currency,
      }))
    )
  })

  //Generate graph data based on the starting amount
  const dailyCash = [
    Dinero({ 
      amount: month.startingAmount.amount, 
      currency: month.startingAmount.currency 
    })
  ]
  
  cashFlowModifiers.slice(1).forEach((modifier) => {
    const lastDayAmount = dailyCash[dailyCash.length - 1]
    dailyCash.push(Dinero({
      amount: lastDayAmount.getAmount() + modifier.getAmount(),
      currency: modifier.getCurrency()
    }))
  })
  
  return dailyCash
}