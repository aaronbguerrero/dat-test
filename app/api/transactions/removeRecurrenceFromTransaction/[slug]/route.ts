import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "../../../../lib/database"

//Remove recurrence from transaction 
//Slug parameters: id
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug)

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").updateOne(
    { _id: id },
    { $set: { isRecurring: false },
      $unset: {
        recurrenceId: "",
        recurrenceFreq: "",
        recurrenceExclusions: ""
      }
    }
  )
  .then(async response => {
    if (response.acknowledged) {
      const deleteResponse = await db.collection("transactions").deleteMany(
        { recurrenceParentId: id }
      )

      return deleteResponse
    }
  })


  if (response?.acknowledged === true) return NextResponse.json(true)
  else return NextResponse.json(false)
}