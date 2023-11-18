import { NextResponse, NextRequest } from "next/server"

import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"

//Delete Transaction
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug)
  
  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").deleteOne({ "_id": id })

  if (response.deletedCount === 1) return NextResponse.json(true)
  else return NextResponse.json(false)
}