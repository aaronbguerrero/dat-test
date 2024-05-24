import { ModifyResult, ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "../../../lib/database"
import type { Transaction } from "../../../types"

//Update Transaction
export async function PATCH(request: NextRequest) {
  const body: {
    _id: ObjectId,
    property: string,
    value: string,
    currency: Dinero.Currency,
  } = await request.json()

  let value: Date | string | { amount: number, currency: Dinero.Currency } = body.value

  switch (body.property) {
    case 'date':
      value = new Date(body.value)
      break

    case 'amount':
      const userCurrency = body.currency
      value = { amount: parseInt(value), currency: userCurrency }
      break
  }

  const client = await clientPromise
  const db = client.db("userData")

  const response = await db.collection<Transaction>("transactions").findOneAndUpdate(
    { _id: new ObjectId(body._id) },
    { $set: {[body.property]: value}},
    { returnDocument: 'after' },
  )

  const modifyResult: ModifyResult = {
    value: response,
    ok: response ? 1 : 0,
  }

  return NextResponse.json(modifyResult)
}