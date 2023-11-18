import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"
import Dinero from 'dinero.js'
import { AuthOptions } from "../../../auth/[...nextauth]/route"
type Dinero = typeof Dinero

export interface MonthData {
  readonly _id: ObjectId
  month: string;
  startingAmount: { amount: number, currency: Dinero.Currency };
  userSetStartingAmount?: boolean;
  endingAmount: { amount: number, currency: Dinero.Currency };
}

//Get month data
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const requestedMonth = params.slug
  const date = new Date(requestedMonth)
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  const client = await clientPromise
  const db  = client.db("userData")

  const monthData = await db.collection<MonthData>("months").findOne({
    $expr: {
      $and: [
        { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
        { "$eq": [{ "$month": "$month" }, month ]},
        { "$eq": [{ "$year": "$month" }, year ]}
      ]
    }
  })
  .then(response => {
    if (!response) return null
    return response
  })

  return NextResponse.json(monthData)
}