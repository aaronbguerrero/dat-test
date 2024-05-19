import { ModifyResult, ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { RRule } from "rrule"
import clientPromise from "../../../lib/database"
import { AuthOptions } from '../../../lib/authOptions'

import type { RecurrenceEditType, RecurrenceException, RecurrenceExceptionProperty, Transaction, TransactionProperty } from '../../../types'
import addException from "../../../lib/addException"
import { isSameDay } from "../../../lib/dates/isSameDay"

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
  
  let value: string | Date | ObjectId | { amount: number, currency: Dinero.Currency } = body.value
  const date =  new Date(body.date)

  switch (body.property) {
    case 'date':
      value = new Date(body.value)
      break

    case 'amount':
      value = { amount: parseInt(value), currency: session?.user?.currencyUsed || 'USD' }
      break

    case 'account':
      value = new ObjectId(body.value)
      break

    //Check to make sure recurrence is not trying to be edited, return error if it is
    case ('recurrenceFreq'):
      if (body.editType !== 'all') return NextResponse.json({ error: "Problem updating recurring transaction." }, { status: 500 })
  }
  
  const client = await clientPromise
  const db = client.db("userData")

  if (body.editType === 'single') {
    const id: ObjectId = new ObjectId(body.parentId || body._id)

    const response = await addException(db, new ObjectId(body.parentId || body._id), body.date, body.property as RecurrenceExceptionProperty, value)

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

    else return NextResponse.json({ error: "Problem updating recurring transaction." }, { status: 500 })
  }
  
  else if (body.editType === 'future') {  
    const id: ObjectId = new ObjectId(body.parentId || body._id)

    //Update end date in parent transaction, create new recurring transaction in it's place

    //Get parent transaction
    const parent = await db.collection<Transaction>("transactions").findOne({ _id: id })
    if (!parent) return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 })

    //update any child transactions in the future
    const response = await db.collection<Transaction>("transactions").updateMany(
      { 
        parentId: id,
      },
      { $set: { 
        [body.property]: value,
      }},
    )
    //Update any exception of a child transaction that's in the future (based on date, not originalDate)
    .then(async response => {
      if (!response.acknowledged) throw new Error("Error updating")

      const propertyToSet = "recurrenceExceptions.$." + body.property.toString()
      return await db.collection<Transaction>("transactions").updateMany(
        { 
          userId: new ObjectId(session?.user?.id),
          parentId: id,
          "recurrenceExceptions.date": { "$gte": new Date(body.date) },
        },
        { $set: { [propertyToSet]: value}}
      )
    })
    //Update/delete recurrence rule in parent (if needed)
    .then(async response => {
      if (!response.acknowledged) throw new Error("Error updating")

      //Get recurrence rules from parent transaction
      const ruleOptions = RRule.parseString(parent.recurrenceFreq || '')

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
        endDate.setUTCDate(endDate.getUTCDate() - 1)

        ruleOptions.count = originalRule.between(parent.date, endDate, true).length
        ruleOptions.until = undefined

      } else {
        //Add new end date and remove any count
        const endDate = new Date(date)
        endDate.setUTCDate(endDate.getUTCDate() - 1)
        ruleOptions.until = new Date(endDate)
        ruleOptions.count = undefined
      }

      //Pull exceptions from parent, create new exceptions to push to parent on update
      const newExceptions: RecurrenceException[] = []
      const updatedParentExceptions: RecurrenceException[] = []

      parent.recurrenceExceptions?.forEach(exception => {
        if (exception.date >= date) {
          if (exception.originalDate < date) {
            //Add exclusion in parent
            updatedParentExceptions.push({
              originalDate: exception.originalDate,
              date: exception.originalDate,
              excludeOnly: true,
            })
          }

          newExceptions.push({...exception, [body.property]: value})
        } 
        else {
          if (exception.originalDate >= date) {
            //Add exception in future
            newExceptions.push({
              originalDate: exception.originalDate,
              date: exception.originalDate,
              excludeOnly: true,
            })
          }

          updatedParentExceptions.push(exception)
        } 
      })

      //Create new transaction
      const newRuleOptions = RRule.parseString(parent.recurrenceFreq || '')

      newRuleOptions.until = originalEndDate
      newRuleOptions.count = originalEndCount

      const newRule = new RRule(newRuleOptions)
      const newProperties = {
        [body.property]: value,
        date: newExceptions.find(exception => {
          if (isSameDay(exception.date, date)) return exception
        })?.originalDate || date,
        recurrenceFreq: newRule.toString(),
        recurrenceExceptions: newExceptions || [],
      }
      const newTransaction = {...parent, ...newProperties}

      if ((ruleOptions.count === 0) || (ruleOptions.until && (new Date(ruleOptions.until) < new Date(parent.date)))) {
        //If parent transaction would have no occurrences, then update it with new information
        if (new Date(date) >= new Date(parent.date)) {
          const updatedParent = await db.collection<Transaction>("transactions").findOneAndReplace(
            { _id: parent._id },
            { 
              ...newTransaction,
              ...{
                recurrenceExceptions: updatedParentExceptions,
              },
            },
            { returnDocument: 'after' },
            )

            const modifyResult: ModifyResult<Transaction> = {
              value: updatedParent,
              ok: 1,
            }
          } 
          
        //If date is an exclusion before the parent, update:
        // parent or children,
        // and all exclusions of both parent and children after the date
        else {
          return await db.collection<Transaction>("transactions").updateMany(
            { $or: [
              { _id: parent._id },
              { parentId: parent._id }
            ]},
            { 
              $set: {[body.property]: value},
            },
          )
          .then(async response => {
            if (!response.acknowledged) throw new Error("Error updating")

            const propertyToSet = "recurrenceExceptions.$." + body.property.toString()

            return await db.collection<Transaction>("transactions").updateMany(
              { 
                $and: [
                  { $or: [
                    { parentId: id },
                    { _id: id },
                  ]},
                  { "recurrenceExceptions.date": { "$gte": new Date(body.date) }},
                ]
              },
              { $set: { [propertyToSet]: value}}
            )
            .then(async response => {
              if (!response.acknowledged) throw new Error("Error updating")

              return await db.collection<Transaction>("transactions").findOne({ _id: id })
              .then(response => {
                if (!response) throw new Error("Error updating")

                response._id = body._id
                response.date = body.date

                const modifyResult: ModifyResult<Transaction> = {
                  ok: 1,
                  value: response,
                }

                return modifyResult
              })
            })
          })
        }
        
      }

      //Otherwise, update parent and create new transaction for future occurrences
      else {
        return await db.collection<Transaction>("transactions").findOneAndUpdate(
          { _id: parent._id },
          { 
            $set: {
              recurrenceFreq: new RRule(ruleOptions).toString(),
              recurrenceExceptions: updatedParentExceptions,
            },
          },
          { returnDocument: 'after' },
        )
        //Insert new transaction for future occurrences
        .then(async response => {
          if (!response) throw new Error("Error updating")

          const insertResult = await db.collection("transactions")
          .insertOne({
            ...newTransaction, 
            ...{
              _id: new ObjectId(), 
              parentId: new ObjectId(parent.parentId || parent._id),
              isRecurring: true, 
            }
          })

          if (insertResult.insertedId) {
            const modifyResult: ModifyResult<Transaction> = {
              value: {...newTransaction, ...{ _id: insertResult.insertedId }},
              ok: 1,
            }

            return modifyResult
          }
          else throw new Error("Error updating")
        })
      } 
    })

    if (response?.ok == 1) return NextResponse.json(response)

    else return NextResponse.json({ error: "Problem updating recurring transaction." }, { status: 500 })
  }
  
  else if (body.editType === 'all') {
    const id: ObjectId = new ObjectId(body.parentId || body._id)

    const parent = await db.collection<Transaction>("transactions").findOne({ _id: id })
    if (!parent) return NextResponse.json({ error: 'Parent transaction not found' }, { status: 404 })
  
    const response = await db.collection<Transaction>("transactions").updateMany(
      { 
        $or: [
          { _id: parent._id },
          { parentId: parent.parentId },
          { _id: parent.parentId },
          { parentId: parent._id },
        ]
      },
      { $set: {[body.property]: value}},
    )
    .then(async response => {
      if (response.acknowledged) {
        const propertyToFind = "recurrenceExceptions." + body.property.toString()
        const propertyToSet = "recurrenceExceptions.$." + body.property.toString()

        const exceptionResponse = await db.collection<Transaction>("transactions").updateMany(
          { 
            userId: new ObjectId(session?.user?.id),
            $or: [
              { parentId: id },
              { _id: id },
            ],
            
            [propertyToFind]: { "$exists": true },
          },
          { $set: { [propertyToSet]: value }}
        )
        
        return exceptionResponse 
      }
    })

    if (response?.acknowledged) {
      const transaction = await db.collection<Transaction>("transactions").findOne(
        { _id: id }
      )

      const ModifyResultResponse: ModifyResult<Transaction> = {
        ok: 1,
        value: transaction,
      }
      return NextResponse.json(ModifyResultResponse)
    } 

    else return NextResponse.json({ error: "Problem updating recurring transaction." }, { status: 500 })
  }

  else return NextResponse.json({ error: "Problem updating recurring transaction." }, { status: 500 })
}