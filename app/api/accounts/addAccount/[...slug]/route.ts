import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from "../../../auth/[...nextauth]/route"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"

//Add Account to DB
//Slug parameters: title/type/color
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const title = decodeURIComponent(params.slug[0])
  const type = params.slug[1]
  const color = decodeURIComponent(params.slug[2])


  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("accounts").insertOne(
    { 
      title: title, 
      type: type,
      color: color,
      userId: new ObjectId(session?.user?.id),
    }
  )

  return NextResponse.json(response)
}