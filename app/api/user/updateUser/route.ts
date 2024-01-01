import { ObjectId } from "mongodb"
import clientPromise from "../../../lib/database"
import { NextRequest, NextResponse } from "next/server"

//Update User
export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
    property: string,
    value: string,
  } = await request.json()
  
  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("users").updateOne(
    { _id: new ObjectId(body._id) },
    { $set: {[body.property]: body.value}}
  )

  return NextResponse.json(response)
}