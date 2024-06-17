import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from '../../../lib/authOptions'
import getTransactions from "../../../lib/getTransactions"

import type { MonthData } from "../../../types"
import calculateAndUpdateMonthData from "../../../lib/calcMonthData"

//Set month data
//1. Get data
  // Transactions and monthData

//2. Calculate data:
  //-daily balance
  //-total income
  //-total expenses
  //-ending amount

//3. Set data if different that what's stored

export async function PUT(request: NextRequest) {
  const body: {
    month: string,
  } = await request.json()

  const session = await getServerSession(AuthOptions)

  const date = new Date(body.month)
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

    //Calculate and return month data
    return calculateAndUpdateMonthData(transactions, monthData, db, session.user.currencyUsed || 'USD')
  }
}