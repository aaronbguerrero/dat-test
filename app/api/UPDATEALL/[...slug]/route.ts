import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"

//Add Month to DB
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const month = new Date(params.slug[0])
  const startingAmount = { amount: parseInt(params.slug[1]), currency: 'USD' }

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").updateMany({}, {$set: {'isRecurring': false}})

  return NextResponse.json(response)
}