import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"

//Utility to quickly push updates to DB during dev
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const month = new Date(params.slug[0])
  const startingAmount = { amount: parseInt(params.slug[1]), currency: 'USD' }

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").updateMany({}, {$set: {'account': new ObjectId('6564eea8a3e854baf33a04e9')}})

  return NextResponse.json(response)
}