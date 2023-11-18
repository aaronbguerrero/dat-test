import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb";
import type { MonthData } from "../../getMonthData/[slug]/route";
import type { Transaction } from "../../../transactions/getTransactions/[slug]/route";
import Dinero from 'dinero.js'
import { getServerSession } from "next-auth/next"
import { AuthOptions } from "../../../auth/[...nextauth]/route"
import getTransactions from "../../../../lib/getTransactions";

//Set month ending amount
//1. Get data
  // Transactions and Starting Amount
//2. Calculate ending amount
//3. Set ending amount if different that what's stored

export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const requestedMonth = params.slug
  const date = new Date(requestedMonth)
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()
  
  const client = await clientPromise
  const db  = client.db("userData")

  if (session?.user) {
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

    //Add each transaction's amount to the endingAmount total
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

  return NextResponse.json(false)
}