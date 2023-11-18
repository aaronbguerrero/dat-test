import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"

//Update month data. Slug parameters: month id/property to change/amount/currency
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug[0])
  const property = params.slug[1]

  let upsert = true
  let value
  if ((property === 'startingAmount') || (property === 'endingAmount')) {
    value = { amount: parseInt(params.slug[2]), currency: params.slug[3] }
    upsert = false
  }
  else if (property === 'userSetStartingAmount') value = Boolean(params.slug[2])

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("months").updateOne(
    { _id: id },
    { $set: {[property]: value }},
    { upsert: upsert }
  )

  if (response.acknowledged == true) return NextResponse.json(true)
  else return NextResponse.json(false)
}