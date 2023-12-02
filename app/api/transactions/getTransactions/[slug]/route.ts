import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { AuthOptions } from '../../../auth/[...nextauth]/route'
import getTransactions from '../../../../lib/getTransactions'

export interface Transaction {
  readonly _id: string | ObjectId,
  title: string,
  date: Date,
  allDay: boolean,
  amount: { amount: number, currency: Dinero.Currency },
  isRecurring?: boolean,
  recurrenceId?: string,
  recurrenceFreq?: string,
  recurrenceExclusions?: Date[],
  recurrenceParentId?: string,
}

//Get Transactions
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)
  
  const requestedMonth = params.slug
  const date = new Date(requestedMonth)
  
  const client = await clientPromise
  const db  = client.db("userData")

  const transactions = await getTransactions(db, session, date)

  return NextResponse.json(transactions)
}