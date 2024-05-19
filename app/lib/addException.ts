import { Db, ModifyResult, ObjectId } from "mongodb"
import type { RecurrenceException, RecurrenceExceptionProperty, Transaction } from "../types"

export default async function addException(
  db: Db, 
  transactionId: ObjectId, 
  dateToExcept: Date, 
  property: RecurrenceExceptionProperty,
  value: string | Date | ObjectId | { amount: number, currency: Dinero.Currency } | boolean,
) {
  const modifyResult: ModifyResult<Transaction> = {
    value: null,
    ok: 0,
  }

  //Check if there is exception on the date, then patch or add as needed
  const newProperty = "recurrenceExceptions.$." + [property]

  const response = await db.collection<Transaction>('transactions').findOneAndUpdate(
    { _id: transactionId, "recurrenceExceptions.date": new Date(dateToExcept) },
    { $set: { 
      [newProperty]: value,
    }},
    { returnDocument: 'after' },
  )

  

  if (response !== null) {
    modifyResult.value = response
    modifyResult.ok = 1
    
    return modifyResult
  }
  else {
  const exceptionToAdd: RecurrenceException = {
    originalDate: new Date(dateToExcept),
    date: new Date(dateToExcept),
    [property]: value,
  }

  const insertResponse = await db.collection<Transaction>('transactions').findOneAndUpdate(
    { _id: transactionId },
    { $push: { recurrenceExceptions: exceptionToAdd }},
    { returnDocument: 'after' },
    )

    if (insertResponse !== null) {
      modifyResult.value = insertResponse
      modifyResult.ok = 1
    } 
    
    return modifyResult
  }
}