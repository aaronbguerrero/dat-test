import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import { RRule } from "rrule"
import clientPromise from "../../../../lib/database"

import type { Transaction } from "../../getTransactions/[slug]/route"

//Update Recurring Transaction. 
//Slug parameters: editType/recurrenceParentId/date to change/property to change/value/currency (optional)
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const editType = params.slug[0]
  const parentId = new ObjectId(params.slug[1])
  const date = new Date(params.slug[2])
  const property = params.slug[3]
  let value: any = decodeURIComponent(params.slug[4])

  switch (property) {
    case 'date':
      value = new Date(value)
      break

    case 'amount':
      const userCurrency = params.slug[5]
      value = { amount: parseInt(value), currency: userCurrency }
      break
  }
  
  const client = await clientPromise
  const db = client.db("userData")

  if (editType === 'single') {
      //Create exclusion in parent transaction, then create new transaction in it's place
      const response = await db.collection("transactions").updateOne(
        { _id: parentId },
        { $push: { recurrenceExclusions: date }}
      )
      .then(async response => {
        const parent = await db.collection("transactions").findOne({ _id: parentId })

        if (parent) {
          const newProperties = {
            [property]: value,
            isRecurring: false,
            _id: new ObjectId(),
            date: (property === 'date') ? value : date,
          }
          const newTransaction = {...parent, ...newProperties}
          delete newTransaction.recurrenceFreq
          delete newTransaction.recurrenceExclusions

          return await db.collection("transactions").insertOne(newTransaction)
        }
      })
      
    if (response?.insertedId) return NextResponse.json(true)
    else return NextResponse.json(false) 
  }
  
  else if (editType === 'future') {    
    //Update end date in parent transaction, create new recurring transaction in it's place
    //Get recurrence rules from parent
    const parent = await db.collection("transactions").findOne({ _id: parentId })
    if (!parent) return NextResponse.json(false)

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
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() - 1)
      ruleOptions.count = originalRule.between(parent.date, endDate, true).length
      ruleOptions.until = undefined

    } else {
      //Add new end date and remove any count
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() - 1)
      ruleOptions.until = new Date(endDate)
      ruleOptions.count = undefined
    }

    //Create new transaction
    newRuleOptions.until = originalEndDate
    newRuleOptions.count = originalEndCount

    const newRule = new RRule(newRuleOptions)
    const newProperties = {
      [property]: value,
      _id: new ObjectId(),
      date: (property === 'date') ? value : date,
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

    if (response?.acknowledged === true) return NextResponse.json(true)
    else return NextResponse.json(false) 
  }
  
  else if (editType === 'all') {
    const parent = await db.collection<Transaction>("transactions").findOne({ _id: parentId })

    const response = await db.collection("transactions").updateMany(
      { recurrenceId: parent?.recurrenceId },
      { $set: {[property]: value}}
      )

      if (response?.acknowledged) return NextResponse.json(true)
      else return NextResponse.json(false)
  }

  else return NextResponse.json(false)
}