import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"

export async function DELETE(request: NextRequest) {
  const body: {
    _id: ObjectId,
  } = await request.json()

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("accounts").deleteOne({ "_id": new ObjectId(body._id) })
  .then(async response => {
    if (response.deletedCount === 1) {
      return await db.collection("transactions").deleteMany({ "account": new ObjectId(body._id)})
    }
  })

  return NextResponse.json(response)
}