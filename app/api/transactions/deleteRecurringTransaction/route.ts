import { NextResponse, NextRequest } from "next/server"
import clientPromise from "../../../lib/database"
import { ObjectId } from "mongodb"
import { RRule } from "rrule"

import type { RecurrenceEditType } from '../../../types'

//Delete Recurring Transaction
export async function DELETE(request: NextRequest) {
  const body: {
    _id?: ObjectId,
    parentId?: ObjectId,
    editType: RecurrenceEditType,
    date: Date,
  } = await request.json()

  const date =  new Date(body.date)
  
  const client = await clientPromise
  const db = client.db("userData")

  if (body.editType === 'single') {
    const id: ObjectId = new ObjectId(body._id || body.parentId)

    //Create exclusion in parent transaction
    const response = await db.collection("transactions").updateOne(
      { _id: id },
      { $push: { recurrenceExceptions: {
        date: date,
        property: 'exclude',
      }}}
    )
    
    if (response.modifiedCount === 1) return NextResponse.json(response)
    else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'future') { 
    //TODO NEED TO CHECK IF THIS ORDER IS CORRET (or needed)
    const id: ObjectId = new ObjectId(body._id || body.parentId)

    //Update end date in parent transaction
    //Get recurrence rules from parent
    const parent = await db.collection("transactions").findOne({ _id: id })
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
      { _id: id },
      { $set: { recurrenceFreq: new RRule(ruleOptions).toString() }}
      )
      
      if (response.modifiedCount === 1) return NextResponse.json(response)
      else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'all') {
    const id: ObjectId = new ObjectId(body.parentId || body._id)

    const response = await db.collection("transactions").deleteOne({ 
      "_id": new ObjectId(body.parentId || body._id) 
    })
    //.then()
    //TODO: delete all that have the parent id of the parent
    
    if (response.deletedCount === 1) return NextResponse.json(response)
    else return NextResponse.json({ status: 500 })
  } 
  
  return NextResponse.json({ status: 500 })
}