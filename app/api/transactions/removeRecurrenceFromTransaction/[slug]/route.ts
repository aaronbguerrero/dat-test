import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "../../../../lib/database"

//Remove recurrence from transaction 
//Slug parameters: id
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const id = new ObjectId(params.slug)

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("transactions").findOneAndUpdate(
    { _id: id },
    { $set: { isRecurring: false },
      $unset: {
        recurrenceId: null,
        recurrenceFreq: "",
        recurrenceExclusions: ""
      }
    },
    { returnDocument: 'after' },
  )
  .then(async response => {
    console.log('id', id)
    console.log('res', response)
    if (response.ok === 1) {
      const deleteResponse = await db.collection("transactions").deleteMany(
        { recurrenceParentId: id }
      )

      if (!deleteResponse.acknowledged) return NextResponse.error()
      else return response
    }
  })

  return NextResponse.json(response)
}