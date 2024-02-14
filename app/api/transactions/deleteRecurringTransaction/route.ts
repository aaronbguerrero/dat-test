import { NextResponse, NextRequest } from "next/server"
import clientPromise from "../../../lib/database"
import { DeleteResult, ObjectId } from "mongodb"
import { RRule } from "rrule"

import type { RecurrenceEditType, RecurrenceException, Transaction } from '../../../types'
import addException from "../../../lib/addException"
import { getServerSession } from "next-auth"
import { AuthOptions } from '../../../lib/authOptions'

//Delete Recurring Transaction
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(AuthOptions)

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
    const response = await addException(db, id, date, 'excludeOnly', true)

    const deleteResult: DeleteResult = {
      acknowledged: true,
      deletedCount: 1,
    }
    
    if (response.ok === 1) return NextResponse.json(deleteResult)
    else return NextResponse.json({ status: 500 })
  }
  
  else if (body.editType === 'future') { 
    const id: ObjectId = new ObjectId(body.parentId || body._id)

    //Update end date in parent transaction
    //Get recurrence rules from parent
    const parent = await db.collection<Transaction>("transactions").findOne({ _id: id })
    if (!parent) return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 })

    const ruleOptions = RRule.parseString(parent?.recurrenceFreq || '')
    
    //Adjust count to exclude previous dates
    if (ruleOptions.count) {
      //Get original rule
      const originalRuleOptions = { ...ruleOptions, dtstart: parent?.date}
      const originalRule = new RRule(originalRuleOptions)
      
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

    const updatedParentExceptions: RecurrenceException[] = []
    
    parent?.recurrenceExceptions?.forEach(exception => {
      if (exception.date >= date) {
        if (exception.originalDate < date) {
          //Add exclusion
          updatedParentExceptions.push({
            originalDate: exception.originalDate,
            date: exception.originalDate,
            excludeOnly: true,
          })
        }
      } 
      else updatedParentExceptions.push(exception)
    })
    
    //Update recurrence rule in parent
    const response = await db.collection<Transaction>("transactions").updateOne(
      { _id: id },
      { $set: { 
        recurrenceFreq: new RRule(ruleOptions).toString(),
        recurrenceExceptions: updatedParentExceptions, 
      }}
      )
      .then(async response => {
        //Delete any future child transactions 
        ////TODO(need to check for exceptions in past first (create new ones in parent if needed))
        if (response.modifiedCount === 1) {
          await db.collection<Transaction>("transactions").deleteMany(
            {
              userId: new ObjectId(session?.user?.id),
              parentId: id,
              date: { "$gte": date }
            }
            )
            //Pull all exceptions with same parentId and delete those if exist
            .then(async response => {
            if (response.acknowledged) {
              await db.collection<Transaction>("transactions").updateMany(
                { userId: new ObjectId(session?.user?.id),
                  parentId: id,
                },
                { $pull: { 'recurrenceExceptions': { date: { "$gte": date }}}},
              )
            }

            else return NextResponse.json({ status: 500 })
          })

          return response
        }

        else return NextResponse.json({ status: 500 })
      })
      
       return NextResponse.json(response)
  }
  
  
  else if (body.editType === 'all') {
    const id: ObjectId = new ObjectId(body.parentId || body._id)

    const parent = await db.collection<Transaction>("transactions").findOne({ _id: id })
    if (!parent) return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 })

    const response = await db.collection("transactions").deleteMany({ 
      $and: [
        {
          $or: [
            { _id: parent._id || new ObjectId() },
            { parentId: parent.parentId || new ObjectId() },
            { _id: parent.parentId || new ObjectId() },
            { parentId: parent._id || new ObjectId() },
          ]
        },
        { userId: new ObjectId(session?.user?.id) }
      ]
      
      
    })
    
    if (response.acknowledged) return NextResponse.json(response)
    else return NextResponse.json({ status: 500 })
  } 
  
  return NextResponse.json({ status: 500 })
}