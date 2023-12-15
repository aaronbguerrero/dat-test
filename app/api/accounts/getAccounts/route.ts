import { NextResponse } from "next/server"
import { getServerSession } from 'next-auth/next'
import { AuthOptions } from "../../auth/[...nextauth]/route"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"

import type { Account } from "../../../types"

export async function GET() {
  const session = await getServerSession(AuthOptions)

  const client = await clientPromise
  const db  = client.db("userData")

  const accountsData = await db.collection<Account>('accounts').find({
    $expr: {
      $and: [
        { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
      ]
    }
  }).toArray()

  return NextResponse.json(accountsData)
}