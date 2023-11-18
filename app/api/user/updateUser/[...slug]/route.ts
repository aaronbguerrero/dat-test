import { ObjectId } from "mongodb"
import clientPromise from "../../../../lib/database"
import { NextRequest, NextResponse } from "next/server"

//Update User Property. Slug parameters: id/property to change/value
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug[0])
  const property = params.slug[1]
  const value = params.slug[2]
  
  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("users").updateOne(
    { _id: id },
    { $set: {[property]: value}}
    )

  if (response.modifiedCount === 1) return NextResponse.json(true)
  else return NextResponse.json(false)
}