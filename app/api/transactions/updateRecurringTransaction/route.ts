import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { RRule } from "rrule"
import clientPromise from "../../../lib/database"
import { AuthOptions } from "../../auth/[...nextauth]/route"

import type { RecurrenceEditType, RecurrenceException, RecurrenceExceptionType, Transaction, TransactionProperty } from '../../../types'

//Update Recurring Transaction 

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(AuthOptions)

  const body: {
    _id: ObjectId,
    editType: RecurrenceEditType,
    parentId?: ObjectId,
    date: Date, //date to change,
    property: TransactionProperty,
    value: string,
  } = await request.json()
  
  let value: string | Date | { amount: number, currency: Dinero.Currency } = body.value
  const id: ObjectId = new ObjectId(body.parentId || body._id)
  const date =  new Date(body.date)

  switch (body.property) {
    case 'date':
      value = new Date(body.value)
      break

    case 'amount':
      value = { amount: parseInt(value), currency: session?.user?.currencyUsed || 'USD' }
      break

    //Check to make sure recurrence is not trying to be edited, return error if it is
    case ('recurrenceFreq'):
      if (body.editType !== 'all') return NextResponse.json({ status: 500 })
  }
  
  const client = await clientPromise
  const db = client.db("userData")

  if (body.editType === 'single') {
    //Create exception in parent transaction
    const response = await db.collection<Transaction>("transactions").findOneAndUpdate(
      { _id: id },
      { $push: { recurrenceExceptions: {
        date: date,
        property: body.property as RecurrenceExceptionType,
        value: value,
      }}},
      { returnDocument: 'after' },
    )

    if (response.ok === 1) {
      const newTransactionProperties = {
        [body.property]: value,
        _id: body._id,
        date: (body.property === 'date') ? value as Date : date,
      }
      const newTransaction = {...response.value, ...newTransactionProperties} as Transaction

      response.value = newTransaction
      return NextResponse.json(response)
    }

    else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'future') {    
    //Update end date in parent transaction, create new recurring transaction in it's place
    //Get recurrence rules from parent
    const parent = await db.collection<Transaction>("transactions").findOne({ _id: id })
    if (!parent) return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 })

    const ruleOptions = RRule.parseString(parent.recurrenceFreq || '')
    const originalRule = new RRule({ ...ruleOptions, dtstart: parent.date})
    
    const newExceptions = originalRule.between(date, new Date('9999-12-31'), true)
    .map(exception => {
      const newException: RecurrenceException = {
        date: exception,
        property: body.property as RecurrenceExceptionType,
        value: value,
      }

      return newException
    })

    const response = await db.collection<Transaction>("transactions").findOneAndUpdate(
      { _id: id },
      { $push: { recurrenceExceptions: { $each: newExceptions }}},
      { returnDocument: 'after' },
    )

    if (response?.ok === 1) {
      const newProperties = {
        _id: body._id,
        [body.property]: value,
        date: (body.property === 'date') ? value : date,
      }

      const newTransaction = {...parent, ...newProperties} as Transaction
      response.value = newTransaction
      
      return NextResponse.json(response)
    }
    else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'all') {
    const response = await db.collection<Transaction>("transactions").findOneAndUpdate(
      { _id: id },
      { $set: {[body.property]: value}},
      { returnDocument: 'after' },
      )

      if (response?.ok === 1) return NextResponse.json(response)
      else return NextResponse.json({ status: 500 })
  }

  else return NextResponse.json({ status: 500 })
}