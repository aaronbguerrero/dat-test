import { NextResponse, NextRequest } from "next/server"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"
import { RRule } from "rrule"

import type { RecurrenceEditType, Transaction } from '../../../types'

//Delete Recurring Transaction
export async function DELETE(request: NextRequest) {
  const body: {
    editType: RecurrenceEditType,
    parentId: ObjectId,
    date: Date,
  } = await request.json()

  const parentId = new ObjectId(body.parentId)
  const date =  new Date(body.date)
  
  const client = await clientPromise
  const db = client.db("userData")

  if (body.editType === 'single') {
    //Create exclusion in parent transaction
    const response = await db.collection("transactions").updateOne(
      { _id: parentId },
      { $push: { recurrenceExclusions: date }}
    )
    
    if (response.modifiedCount === 1) return NextResponse.json(response)
    else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'future') {
    //Update end date in parent transaction
    //Get recurrence rules from parent
    const parent = await db.collection("transactions").findOne({ _id: parentId })
    const ruleOptions = RRule.parseString(parent?.recurrenceFreq || '')
    
    //Adjust count to exclude previous dates
    if (ruleOptions.count) {
      //Get original rule
      const originalRuleOptions = { ...ruleOptions, dtstart: parent?.date}
      const originalRule = new RRule(originalRuleOptions)
      
      //Add count for new rule and remove end date
      const endDate = date
      endDate.setDate(endDate.getDate() - 1)
      
      ruleOptions.count = originalRule.between(parent?.date, endDate, true).length
      ruleOptions.until = undefined
      
    } else {
      //Add new end date and remove any count
      const endDate = date
      endDate.setDate(endDate.getDate() - 1)
      
      ruleOptions.until = new Date(endDate)
      ruleOptions.count = undefined
    }
    
    //Update recurrence rule in parent
    const response = await db.collection("transactions").updateOne(
      { _id: parentId },
      { $set: { recurrenceFreq: new RRule(ruleOptions).toString() }}
      )
      
      if (response.modifiedCount === 1) return NextResponse.json(response)
      else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'all') {
    // const response = await db.collection("transactions").findOneAndDelete({ "_id": parentId })
    // .then(response => {
    // })
    
    const parent = await db.collection<Transaction>("transactions").findOne({ _id: parentId })

    const response = await db.collection("transactions")
    .deleteMany({ recurrenceId: parent?.recurrenceId })

    if (response.acknowledged) return NextResponse.json(response)
    else return NextResponse.json({ status: 500 })
  } 
  
  return NextResponse.json({ status: 500 })
}