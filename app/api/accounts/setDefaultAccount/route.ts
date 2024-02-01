import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"

import type { Account } from "../../../types"
import { AuthOptions } from "../../auth/[...nextauth]/route"

//Set default financial account
export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
  } = await request.json()

  const session = await getServerSession(AuthOptions)

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection('accounts').updateOne(
    { userId: new ObjectId(session?.user?.id), isDefault: true},
    {$set: {isDefault: false}}
  )
  .then(async response => {
    if (response.modifiedCount === 1) {
      return await db.collection<Account>('accounts').findOneAndUpdate(
        { _id: new ObjectId(body._id) },
        { $set: {isDefault: true}},
        { returnDocument: 'after' },
      )
    }

    else return NextResponse.json({ status: 500 })
  })

  return NextResponse.json(response)
}