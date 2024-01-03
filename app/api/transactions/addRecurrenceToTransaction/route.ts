import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "../../../lib/database"

//Add recurrence to transaction 
export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
    rule: string,
  } = await request.json()

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").findOneAndUpdate(
    { _id: new ObjectId(body._id) },
    { $set: {
      recurrenceFreq: body.rule,
      recurrenceExceptions: [],
    }},
    { returnDocument: 'after' },
  )

  return NextResponse.json(response)
}