import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../../lib/database"
import { AuthOptions } from '../../../auth/[...nextauth]/route'
import getTransactions from '../../../../lib/getTransactions'
import { ObjectId } from 'mongodb'

//Get Transaction. Slug: Transaction id
//TODO: Test!
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)
  
  const id = new ObjectId(params.slug) 
  
  const client = await clientPromise
  const db  = client.db("userData")

  const transaction = await db.collection('transactions').findOne({ _id: id })

  return NextResponse.json(transaction)
}
