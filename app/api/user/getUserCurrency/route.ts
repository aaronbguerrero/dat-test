import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from "../../auth/[...nextauth]/route"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"

//Get user currency
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

   //Open DB connection
   const client = await clientPromise
   const db  = client.db("userData")
 
   //Get and return month's ending amount
   const user = await db.collection("users").findOne({
    _id: new ObjectId(session?.user?.id)
   })
   .then(response => {
    if (!response) return null    
    return response.currencyUsed
  })

  return NextResponse.json(user)
}