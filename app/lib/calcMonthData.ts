import { NextResponse } from 'next/server'
import Dinero from 'dinero.js'
import generateDailyCashPosition from './generateDailyCashPosition'

import type { MonthData, Transaction } from '../types'
import { Db } from 'mongodb'

export default async function calculateAndUpdateMonthData (
  transactions: Transaction[], 
  monthData: MonthData,
  db: Db,
  currency: Dinero.Currency,
) {
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

  //If there is no change, return true
  if (
    monthData.dailyBalance &&
    dailyBalance.every((dailyAmount, index) => {
      return (dailyAmount.getAmount() === monthData.dailyBalance[index]?.amount)
    }) &&
    income.getAmount() === monthData.totalIncome?.amount &&
    expenses.getAmount() === monthData.totalExpenses?.amount &&
    endingAmount.getAmount() === monthData.endingAmount?.amount
    ) return NextResponse.json(true)

  //Otherwise update the month's data
  const response = await db.collection("months").updateOne(
    { _id: monthData._id },
    { $set: {
      dailyBalance: dailyBalance.map(dailyAmount => {
        return {
           amount: dailyAmount.getAmount(),
           currency: dailyAmount.getCurrency(),
          }
      }),
      totalIncome: { amount: income.getAmount(), currency: currency },
      totalExpenses: { amount: expenses.getAmount(), currency: currency },
      endingAmount: { amount: endingAmount.getAmount(), currency: currency },
    }}
  )

  if (response.acknowledged) return NextResponse.json(true)
  else return NextResponse.json(false)
}