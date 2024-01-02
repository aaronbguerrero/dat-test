import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "../../../lib/database"

//Remove recurrence from transaction 

export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
  } = await request.json()

  const id = new ObjectId(body._id)

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").findOneAndUpdate(
    { _id: id },
    {$unset: {
      recurrenceFreq: "",
      recurrenceExclusions: ""
    }},
    { returnDocument: 'after' },
  )
 
  return NextResponse.json(response)
}