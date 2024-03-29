import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { AuthOptions } from '../../../../lib/authOptions'
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"
import getPreviousMonth from "../../../../lib/dates/getPreviousMonth"

//Get last month's ending amount
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const session = await getServerSession(AuthOptions)

  const date = getPreviousMonth(new Date(params.slug)) //Create date object for current month and set it to previous month

  //Extract month and year
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  //Open DB connection
  const client = await clientPromise
  const db  = client.db("userData")

  //Get and return month's ending amount
  const monthData = await db.collection("months").findOne({
    $expr: {
      $and: [
        { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
        { "$eq": [{ "$month": "$month" }, month ]},
        { "$eq": [{ "$year": "$month" }, year ]}
      ]
    }
  })
  .then(result => {
    if (!result) {
      return 0
    }

    return result.endingAmount.amount
  })

  return NextResponse.json(monthData)
}