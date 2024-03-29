import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { AuthOptions } from '../../../../lib/authOptions'
import getTransactions from '../../../../lib/getTransactions'

//Get Transactions. Slug: month
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)
  
  const date = new Date(params.slug)
  
  const client = await clientPromise
  const db  = client.db("userData")

  const transactions = await getTransactions(db, session, date)

  return NextResponse.json(transactions)
}