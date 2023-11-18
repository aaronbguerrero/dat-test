import type { Transaction } from '../api/transactions/getTransactions/[slug]/route'
import type { MonthData } from '../api/months/getMonthData/[slug]/route'
import Dinero from 'dinero.js'
import getDaysInMonth from './dates/getDaysInMonth'

//TODO: Fix currency and convert to Dinero
export default function generateDailyCashPosition (transactions: Transaction[] | undefined, month: MonthData):number[] {
  //Setup array with a baseline of 0 change for each day
  const cashFlowModifiers = new Array(getDaysInMonth(month.month) + 1).fill(0)

  //If data needed isn't there, return no change for entire month
  if ((!month.startingAmount) || (!transactions)) return cashFlowModifiers
  
  //Add/subtract each transaction's amount on the appropriate day
  transactions.forEach((transaction) => {
    const index = new Date(transaction.date).getUTCDate()
    const existingModifier = cashFlowModifiers[index]

    cashFlowModifiers.splice(
      index, 
      1, 
      (existingModifier + 
        Dinero({ 
          amount: transaction.amount.amount, 
          currency: transaction.amount.currency })
        .getAmount()
      )
    )
  })

  //Generate graph data based on the starting amount
  const dailyCash = [
    Dinero({ 
      amount: month.startingAmount.amount, 
      currency: month.startingAmount.currency 
    })
    .getAmount()
  ]
  
  cashFlowModifiers.slice(1).forEach((amount) => {
    const lastDayAmount = dailyCash[dailyCash.length - 1]
    dailyCash.push(lastDayAmount + amount)
  })
  
  return dailyCash
}