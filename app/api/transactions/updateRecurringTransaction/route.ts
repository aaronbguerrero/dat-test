import { Dinero } from "dinero.js"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { RRule } from "rrule"
import clientPromise from "../../../lib/database"

import type { RecurrenceEditType, Transaction } from '../../../types'
import { AuthOptions } from "../../auth/[...nextauth]/route"

//Update Recurring Transaction 

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(AuthOptions)

  const body: {
    _id: ObjectId,
    editType: RecurrenceEditType,
    recurrenceParentId: ObjectId,
    date: Date, //date to change,
    property: string,
    value: string,
  } = await request.json()
  
  let value: string | Date | { amount: number, currency: Dinero.Currency } = body.value
  const parentId = new ObjectId(body.recurrenceParentId)
  const date = new Date(body.date)

  switch (body.property) {
    case 'date':
      value = new Date(body.value)
      break

    case 'amount':
      value = { amount: parseInt(value), currency: session?.user?.currencyUsed || 'USD' }
      break
  }
  
  const client = await clientPromise
  const db = client.db("userData")

  //TODO: TEST ALL ERRORS
  const parent = await db.collection<Transaction>("transactions").findOne({ _id: parentId })
  if (!parent) return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 })

  if (body.editType === 'single') {
      //Create exclusion in parent transaction, then create new transaction in it's place
      const response = await db.collection("transactions").updateOne(
        { _id: parentId },
        { $push: { recurrenceExclusions: new Date(date) }}
      )
      .then(async () => {
        //Add excluded date to already pulled parent Transaction (to avoid another db call)
        parent.recurrenceExclusions?.push(date)

        const newTransactionProperties = {
          [body.property]: value,
          isRecurring: false,
          _id: new ObjectId(),
          date: (body.property === 'date') ? value : date,
        }
        const newTransaction = {...parent, ...newTransactionProperties}
        delete newTransaction.recurrenceFreq
        delete newTransaction.recurrenceExclusions

        return await db.collection("transactions").insertOne(newTransaction)
      })
      
    if (response?.insertedId) {
      const newTransaction = await db.collection<Transaction>("transactions")
      .findOne({ _id: response.insertedId })

      return NextResponse.json(newTransaction)
    }
    else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'future') {    
    //Update end date in parent transaction, create new recurring transaction in it's place
    //Get recurrence rules from parent

      //TODO: what to do when it's the parent transaction

    

    const ruleOptions = RRule.parseString(parent.recurrenceFreq || '')
    const newRuleOptions = RRule.parseString(parent.recurrenceFreq || '')

    //Get original end date and count
    const originalEndDate = ruleOptions.until
    let originalEndCount = ruleOptions.count
    
    //Adjust count to exclude previous dates
    if (originalEndCount) {
      //Get count for original rule
      const originalRuleOptions = { ...ruleOptions, dtstart: parent.date}
      const originalRule = new RRule(originalRuleOptions)
      originalEndCount = originalRule.between(date, new Date('9999-12-31'), true).length

      //Add count for new rule and remove end date
      const endDate = date
      endDate.setDate(endDate.getDate() - 1)
      ruleOptions.count = originalRule.between(parent.date, endDate, true).length
      ruleOptions.until = undefined

    } else {
      //Add new end date and remove any count
      const endDate = date
      endDate.setDate(endDate.getDate() - 1)
      ruleOptions.until = new Date(endDate)
      ruleOptions.count = undefined
    }

    //Create new transaction
    newRuleOptions.until = originalEndDate
    newRuleOptions.count = originalEndCount

    const newRule = new RRule(newRuleOptions)
    const newProperties = {
      [body.property]: value,
      _id: new ObjectId(),
      date: (body.property === 'date') ? value : date,
      isRecurring: true,
      recurrenceFreq: newRule.toString(),
      recurrenceExclusions: parent.recurrenceExclusions || [],
    }
    const newTransaction = {...parent, ...newProperties}

    const response = await db.collection("transactions").insertOne(newTransaction)
    .then(async response => {
      if (response.insertedId) {
        //Once created, update recurrence rule in parent (if needed)
        //Delete parent
        if ((ruleOptions.count === 0) || (ruleOptions.until && (new Date(ruleOptions.until) < new Date(parent.date)))) {
          await db.collection("transactions").deleteOne({ _id: parentId })
          //TODO: If delete fails, need to log to admin (user does not need to know)
          
          return { acknowledged: true }
        }

        //Update parent
        else return await db.collection("transactions").updateOne(
          { _id: parentId },
          { $set: { recurrenceFreq: new RRule(ruleOptions).toString() }}
        )
      }
    })

    if (response?.acknowledged === true) return NextResponse.json(newTransaction)
    else return NextResponse.json({ status: 500 })

  }
  
  else if (body.editType === 'all') {
    const response = await db.collection("transactions").updateMany(
      { recurrenceId: parent?.recurrenceId },
      { $set: {[body.property]: value}}
      )

      //TODO: Return current transaction
      if (response?.acknowledged) return NextResponse.json(true)
      else return NextResponse.json({ status: 500 })
  }

  else return NextResponse.json({ status: 500 })
}