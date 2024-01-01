import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from '../../auth/[...nextauth]/route'
import clientPromise from '../../../lib/database'
import { ObjectId } from "mongodb"

//Add Transaction to DB

export async function POST(request: NextRequest) {
  const body: {
    date: Date,
    title: string,
    amount: number,
    account: ObjectId,
    recurrence?: string,
  } = await request.json()
  const session = await getServerSession(AuthOptions)

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").insertOne(
    { 
      title: body.title, 
      amount: {
        amount: body.amount,
        currency: session?.user?.currencyUsed
      }, 
      date: new Date(body.date),
      userId: new ObjectId(session?.user?.id),
      account: new ObjectId(body.account),
      isRecurring: body.recurrence ? true : false,
      ...(body.recurrence && {
        recurrenceId: new ObjectId,
        recurrenceFreq: body.recurrence,
        recurrenceExclusions: [],
      })
      
    }
  )

  return NextResponse.json(response)
}