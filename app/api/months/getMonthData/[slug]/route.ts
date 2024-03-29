import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"
import { AuthOptions } from '../../../../lib/authOptions'

import type { MonthData } from "../../../../types"

//Get month data
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const date = new Date(params.slug)
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  const client = await clientPromise
  const db  = client.db("userData")

  const monthData = await db.collection<MonthData>("months").findOne({
    $expr: {
      $and: [
        { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
        { "$eq": [{ "$month": "$month" }, month ]},
        { "$eq": [{ "$year": "$month" }, year ]}
      ]
    }
  })
  .then(response => {
    if (!response) return null
    return response
  })

  return NextResponse.json(monthData)
}