import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from "../../../auth/[...nextauth]/route"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"

//Add Transaction to DB. 
//Slug parameters: date/title/amount/recurrence(optional)
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const date = new Date(params.slug[0])
  const title = decodeURIComponent(params.slug[1])
  const amount: number = parseInt(params.slug[2])
  const recurrence = params.slug[3]

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").insertOne(
    { 
      title: title, 
      amount: {
        amount: amount,
        currency: session?.user?.currencyUsed
      }, 
      date: date,
      userId: new ObjectId(session?.user?.id),
      isRecurring: recurrence ? true : false,
      ...(recurrence && {
        recurrenceId: new ObjectId,
        recurrenceFreq: recurrence,
        recurrenceExclusions: [],
      })
      
    }
  )

  return NextResponse.json(response)
}