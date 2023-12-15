import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from '../../../../lib/database'

export async function GET(request: NextRequest, { params}: { params: { slug: string }}) {
  const id = new ObjectId(params.slug)
  if (!id) return NextResponse.error()

  const client = await clientPromise
  const db = client.db("userData")
  
  const userDeleteResponse = await db.collection("users").deleteOne(
    { _id: id },
  )

  if (userDeleteResponse.deletedCount !== 1) return NextResponse.json(false)

  //Delete user's month data and verify deletion
  await db.collection("months").deleteMany({ userId: id })
  if (await db.collection("months").findOne({ userId: id })) return NextResponse.json(false)
      
  //Delete user's transaction data and verify deletion
  await db.collection("transactions").deleteMany({ userId: id })
  if (await db.collection("transactions").findOne({ userId: id })) return NextResponse.json(false)
  
  //Delete user's external account data and verify deletion
  await db.collection("linkedUserAccounts").deleteOne({ userId: id })
  if (await db.collection("linkedUserAccounts").findOne({ userId: id })) return NextResponse.json(false)

  return NextResponse.json(true)
}