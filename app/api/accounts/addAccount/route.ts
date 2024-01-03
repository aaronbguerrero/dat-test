import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from "../../auth/[...nextauth]/route"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"
import { AccountType } from "../../../types"

//Add Financial Account
export async function POST(request: NextRequest) {
  const session = await getServerSession(AuthOptions)

  const body: {
    title: string,
    type: AccountType,
    color: string,
  } = await request.json()

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("accounts").insertOne(
    { 
      title: body.title, 
      type: body.type,
      color: body.color,
      userId: new ObjectId(session?.user?.id),
    }
  )

  return NextResponse.json(response)
}