import { NextResponse, NextRequest } from "next/server"
import clientPromise from "../../../../lib/database"
import { ObjectId } from "mongodb"
import { RRule } from "rrule"

import type { Transaction } from "../../getTransactions/[slug]/route"

//Delete Recurring Transaction
//Slug parameters: editType/recurrenceParentId/date to change
export async function GET(request: NextRequest, { params }: { params: { slug: string }}) {
  const editType = params.slug[0]
  const parentId = new ObjectId(params.slug[1])
  const date = new Date(params.slug[2])
  
  const client = await clientPromise
  const db = client.db("userData")

  if (editType === 'single') {
    //Create exclusion in parent transaction
    const response = await db.collection("transactions").updateOne(
      { _id: parentId },
      { $push: { recurrenceExclusions: date }}
    )
    
    if (response.modifiedCount === 1) return NextResponse.json(true)
    else return NextResponse.json(false)
  }
  
  else if (editType === 'future') {
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
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() - 1)
      
      ruleOptions.count = originalRule.between(parent?.date, endDate, true).length
      ruleOptions.until = undefined
      
    } else {
      //Add new end date and remove any count
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() - 1)
      
      ruleOptions.until = new Date(endDate)
      ruleOptions.count = undefined
    }
    
    //Update recurrence rule in parent
    const response = await db.collection("transactions").updateOne(
      { _id: parentId },
      { $set: { recurrenceFreq: new RRule(ruleOptions).toString() }}
      )
      
      if (response.modifiedCount === 1) return NextResponse.json(true)
      else return NextResponse.json(false)
  }
  
  else if (editType === 'all') {
    // const response = await db.collection("transactions").findOneAndDelete({ "_id": parentId })
    // .then(response => {
    // })
    
    const parent = await db.collection<Transaction>("transactions").findOne({ _id: parentId })

    const response = await db.collection("transactions")
    .deleteMany({ recurrenceId: parent?.recurrenceId })

    if (response.acknowledged) return NextResponse.json(true)
    else return NextResponse.json(false)
  } 
  
  return NextResponse.json(false)
}