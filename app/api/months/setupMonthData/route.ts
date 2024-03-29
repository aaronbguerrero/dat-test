import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from '../../../lib/authOptions'
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb" 

import getPreviousMonth from "../../../lib/dates/getPreviousMonth"
import getTransactions from "../../../lib/getTransactions"

import type { MonthData } from "../../../types"
import calculateMonthData from "../../../lib/calcMonthData"

//Setup month data
export async function POST(request: NextRequest) {
  const body: {
    month: string,
  } = await request.json()
  
  const date = new Date(body.month)
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
          totalIncome: { amount: 0, currency: session.user.currencyUsed },
          totalExpenses: { amount: 0, currency: session.user.currencyUsed },
          dailyBalance: [], //TODO: initialize with number of days in month and zeroed dineros?
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

    //Calculate month data
    return calculateMonthData(transactions, monthData, db, session.user.currencyUsed || 'USD')
  }
}