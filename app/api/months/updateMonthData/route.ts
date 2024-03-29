import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"
import type { MonthProperty } from "../../../types"

//Update month data
export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
    property: MonthProperty,
    value: number | Boolean,
    currency?: Dinero.Currency,
  } = await request.json()

  let upsert = true
  let value
  if ((body.property === 'startingAmount') || (body.property === 'endingAmount')) {
    value = { amount: body.value, currency: body.currency }
    upsert = false
  }
  else if (body.property === 'userSetStartingAmount') value = Boolean(body.value)

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection("months").updateOne(
    { _id: new ObjectId(body._id) },
    { $set: {[body.property]: value }},
    { upsert: upsert }
  )

  if (response.acknowledged == true) return NextResponse.json(true)
  else return NextResponse.json(false)
}