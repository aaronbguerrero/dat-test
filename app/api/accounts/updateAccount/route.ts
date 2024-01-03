import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"

import type { Account } from "../../../types"

//Update Financial Account
export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
    property: string,
    value: string,
  } = await request.json()

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection<Account>("accounts").findOneAndUpdate(
    { _id: new ObjectId(body._id) },
    { $set: {[body.property]: body.value}},
    { returnDocument: 'after' },
    )
    
return NextResponse.json(response)
}