import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "../../../../lib/database"

//Add recurrence to transaction 
//Slug parameters: id/recurrenceRule
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug[0])
  const rule = params.slug[1]

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").findOneAndUpdate(
    { _id: id },
    { $set: {
      isRecurring: true,
      recurrenceId: new ObjectId,
      recurrenceFreq: rule,
      recurrenceExclusions: [],
    }},
    { returnDocument: 'after' },
  )

  return NextResponse.json(response)
}