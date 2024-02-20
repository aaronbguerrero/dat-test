import Dinero from 'dinero.js'
import generateDailyCashPosition from './generateDailyCashPosition'

import type { MonthData, Transaction } from '../types'

export default function calculateMonthData (transactions: Transaction[], monthData: MonthData) {
  const startingAmount = Dinero({ 
    amount: monthData.startingAmount.amount, 
    currency: monthData.startingAmount.currency 
  })
  
  const dailyBalance = generateDailyCashPosition(transactions, monthData)
  let income = Dinero({ amount: 0, currency: monthData.startingAmount.currency })
  let expenses = Dinero({ amount: 0, currency: monthData.startingAmount.currency })
  let endingAmount = startingAmount
  transactions.forEach((transaction: Transaction) => {
    if (transaction.amount.amount >= 0) income = income.add(Dinero({
      amount: transaction.amount.amount,
      currency: transaction.amount.currency
    }))
    else expenses = expenses.add(Dinero({
      amount: transaction.amount.amount,
      currency: transaction.amount.currency
    }))

    endingAmount = endingAmount.add(Dinero({
      amount: transaction.amount.amount,
      currency: transaction.amount.currency
    }))
  })

  return {
    dailyBalance, income, expenses, endingAmount
  }
}