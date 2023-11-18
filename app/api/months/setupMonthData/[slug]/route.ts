import { NextRequest, NextResponse } from "next/server"
import toMonthString from "../../../../lib/dates/toMonthString"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from "../../../auth/[...nextauth]/route"
import { headers } from 'next/headers'
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb" 
import Dinero from 'dinero.js'

import type { MonthData } from "../../getMonthData/[slug]/route"
import type { Transaction } from "../../../transactions/getTransactions/[slug]/route";
import getPreviousMonth from "../../../../lib/dates/getPreviousMonth"
import getNextMonth from "../../../../lib/dates/getNextMonth"
import { RRule, RRuleSet } from "rrule"
import getTransactions from "../../../../lib/getTransactions"

//Setup month data
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const requestedMonth = params.slug
  
  const date = new Date(requestedMonth)
  const monthString = toMonthString(date)
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  const lastMonthDate = getPreviousMonth(date) //Create date object for current month and set it to previous month
  const lastMonth = lastMonthDate.getUTCMonth() + 1
  const lastMonthYear = lastMonthDate.getUTCFullYear()

  const session = await getServerSession(AuthOptions)
  
  if (session && (session !== undefined) && (session.user)) {

    const client = await clientPromise
    const db  = client.db("userData")
  
    const getMonthData = async (month: number, year: number) => {
      return await db.collection<MonthData>("months").findOne({
        $expr: {
          $and: [
            { "$eq": [ "$userId", new ObjectId(session.user?.id) ]},
            { "$eq": [{ "$month": "$month" }, month ]},
            { "$eq": [{ "$year": "$month" }, year ]}
          ]
        }
      })
    }
  
    //Get current month's data
    let monthData = await getMonthData(month, year)
    
    const lastMonthEndingAmount = await getMonthData(lastMonth, lastMonthYear)
    .then(result => {
      if (!result) {
        return 0
      }
  
      else return result.endingAmount.amount
    })
  
    //If the month doesn't exist, create a new month
    if (!monthData) {
      const response = await db.collection("months").updateOne(
        { month: date, userId: session.user.id },
        { $set: { 
          month: date, 
          startingAmount: { amount: lastMonthEndingAmount, currency: session.user.currencyUsed }, 
          endingAmount: { amount: 0, currency: session.user.currencyUsed }, 
          userId: new ObjectId(session.user.id) 
        }},
        { upsert: true }
      )
        
      if (response.upsertedCount !== 1) return NextResponse.json(false)

      monthData = await getMonthData(month, year)
    }
  
    //If it does exist, and the starting amount is not user set, update the starting amount.
    else if (!monthData.userSetStartingAmount) {
      const response = await db.collection("months").updateOne(
        { _id: monthData._id },
        { $set: { startingAmount: { amount: lastMonthEndingAmount, currency: session.user.currencyUsed }}},
        { upsert: false }
      )
      if (response.acknowledged !== true) return NextResponse.json(false)  
    }

    if (!monthData) return NextResponse.json(false)
      
    //Update ending amount
    const transactions = await getTransactions(db, session, date)

    const startingAmount = Dinero({ 
      amount: monthData.startingAmount.amount, 
      currency: monthData.startingAmount.currency 
    })
    
    let endingAmount = startingAmount
    transactions.forEach((transaction: Transaction) => {
      endingAmount = endingAmount.add(Dinero({
        amount: transaction.amount.amount,
        currency: transaction.amount.currency
      }))
    })
    
    if (endingAmount.getAmount() === monthData.endingAmount?.amount) return NextResponse.json(true)

    const response = await db.collection("months").updateOne(
      { _id: monthData._id },
      { $set: {endingAmount: { amount: endingAmount.getAmount(), currency: session.user.currencyUsed }}}
    )
    
    if (response.modifiedCount === 1) return NextResponse.json(true)
    else return NextResponse.json(false)
  }
  
  else return NextResponse.json(false)
}