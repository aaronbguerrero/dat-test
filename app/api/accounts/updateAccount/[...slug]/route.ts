import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"

import type { Account } from "../../../../types"

//Update Account Property. Slug parameters: id/property to change/value
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug[0])
  const property = params.slug[1]
  let value: any = decodeURIComponent(params.slug[2])

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection<Account>("accounts").findOneAndUpdate(
    { _id: id },
    { $set: {[property]: value}},
    { returnDocument: 'after' },
    )
    
return NextResponse.json(response)
  // if (response.acknowledged) return NextResponse.json(true)
  // else return NextResponse.json(false)
}