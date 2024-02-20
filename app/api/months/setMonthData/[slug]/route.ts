import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"
import Dinero from 'dinero.js'
import { getServerSession } from "next-auth/next"
import { AuthOptions } from '../../../../lib/authOptions'
import getTransactions from "../../../../lib/getTransactions"

import type { MonthData } from "../../../../types"
import type { Transaction } from "../../../../types"
import generateDailyCashPosition from "../../../../lib/generateDailyCashPosition"
import calculateMonthData from "../../../../lib/calcMonthData"

//Set month data
//1. Get data
  // Transactions and Starting Amount

//2. Calculate data:
  //-daily balance
  //-total income
  //-total expenses
  //-ending amount

//3. Set data if different that what's stored

export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const requestedMonth = params.slug
  const date = new Date(requestedMonth)
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()
  
  const client = await clientPromise
  const db  = client.db("userData")

  if (session?.user) {
    //Get data
    const monthData = await db.collection<MonthData>("months").findOne({
      $expr: {
        $and: [
          { "$eq": [ "$userId", new ObjectId(session.user.id) ]},
          { "$eq": [{ "$month": "$month" }, month ]},
          { "$eq": [{ "$year": "$month" }, year ]},
        ]
      }
    })
    
    if (!monthData) return NextResponse.json(false)

    const transactions = await getTransactions(db, session, date)

    //Calculate month data
    const { dailyBalance, income, expenses, endingAmount } = calculateMonthData(transactions, monthData)

    //If there is no change, return true
    if (
      monthData.dailyBalance &&
      dailyBalance.map((dailyAmount, index) => {
        if (dailyAmount.getAmount() === monthData.dailyBalance[index]?.amount) return true
        else return false
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
        totalIncome: { amount: income.getAmount(), currency: session.user.currencyUsed },
        totalExpenses: { amount: expenses.getAmount(), currency: session.user.currencyUsed },
        endingAmount: { amount: endingAmount.getAmount(), currency: session.user.currencyUsed },
      }}
    )

    if (response.modifiedCount === 1) return NextResponse.json(true)
    else return NextResponse.json(false)
  }

  return NextResponse.json(false)
}