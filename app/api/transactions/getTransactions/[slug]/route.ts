import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { AuthOptions } from '../../../auth/[...nextauth]/route'
import getTransactions from '../../../../lib/getTransactions'

//Get Transactions. Slug: month
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)
  
  const requestedMonth = params.slug
  const date = new Date(requestedMonth)
  
  const client = await clientPromise
  const db  = client.db("userData")

  const transactions = await getTransactions(db, session, date)

  return NextResponse.json(transactions)
}