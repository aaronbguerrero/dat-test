import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from '../../../lib/database'

//Delete User
export async function DELETE(request: NextRequest) {
  const body: {
    _id: ObjectId,
  } = await request.json()

  const id = new ObjectId(body._id)

  const client = await clientPromise
  const db = client.db("userData")
  
  const userDeleteResponse = await db.collection("users").deleteOne(
    { _id: id },
  )

  if (userDeleteResponse.deletedCount !== 1) return NextResponse.json({ status: 500 })

  //Delete user's month data and verify deletion
  await db.collection("months").deleteMany({ userId: id })
  if (await db.collection("months").findOne({ userId: id })) return NextResponse.json({ status: 500 })
      
  //Delete user's transaction data and verify deletion
  await db.collection("transactions").deleteMany({ userId: id })
  if (await db.collection("transactions").findOne({ userId: id })) return NextResponse.json({ status: 500 })
  
  //Delete user's external account data and verify deletion
  await db.collection("linkedUserAccounts").deleteOne({ userId: id })
  if (await db.collection("linkedUserAccounts").findOne({ userId: id })) return NextResponse.json({ status: 500 })

  return NextResponse.json(true)
}