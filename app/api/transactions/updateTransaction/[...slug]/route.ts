import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"

//Update Transaction Property. Slug parameters: id/property to change/value/currency (optional)
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug[0])
  const property = params.slug[1]
  let value: any = decodeURIComponent(params.slug[2])

  switch (property) {
    case 'date':
      value = new Date(value)
      break

    case 'amount':
      const userCurrency = params.slug[3]
      value = { amount: parseInt(value), currency: userCurrency }
      break
  }

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").updateOne(
    { _id: id },
    { $set: {[property]: value}}
    )

  if (response.acknowledged) return NextResponse.json(true)
  else return NextResponse.json(false)
}