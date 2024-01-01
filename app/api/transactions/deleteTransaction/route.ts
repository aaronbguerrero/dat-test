import { NextResponse, NextRequest } from "next/server"

import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"

//Delete Transaction
export async function DELETE(request: NextRequest, { params }: { params: { slug: string }}) {
  const body: {
    _id: ObjectId,
  } = await request.json()
  
  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").deleteOne({ "_id": new ObjectId(body._id) })

  return NextResponse.json(response)
}