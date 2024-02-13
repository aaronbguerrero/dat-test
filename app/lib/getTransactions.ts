import { Db, ObjectId } from "mongodb"
import getNextMonth from "./dates/getNextMonth"
import { RRule, RRuleSet } from "rrule"
import getLastDayOfMonth from "./dates/getLastDayOfMonth"

import type { RecurrenceExceptionProperty, Transaction, TransactionProperty } from '../types'
import type { Session } from "next-auth"
import { isSameDay } from "./dates/isSameDay"

export default async function getTransactions ( db: Db, session: Session | null, date: Date) {
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()

  //Get individual transactions in array
  const transactions = await db.collection<Transaction>("transactions").find({
    $or: [
      {"recurrenceFreq": { "$exists": false }, //Do not include the original recurring transactions, they will be setup by the recurring rule
      $expr: {
        $and: [
          { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
          { "$eq": [{ "$month": "$date" }, month ]},
          { "$eq": [{ "$year": "$date" }, year ]},
        ]
      }},

      
    ]
  }).toArray()
  
  //Get recurring transactions and add to array
  const recurringTransactions = await db.collection<Transaction>("transactions").find({
    $or: 
    [
      //This month's recurring transactions
      {"recurrenceFreq": { "$exists": true }, //Only include the original recurring transactions

      $expr: {
        $and: [
          { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
          { $lte: [{ $toDate: "$date" }, getNextMonth(date)]},
        ]
      }},

      //Other month's recurring transaction exceptions
      {
        $and: [
          {recurrenceExceptions: {
            $elemMatch: {
              type: "date",
              value: {
                $gte: date,
                $lte: getNextMonth(date)
              }
           }
          }},
          
          { "userId": new ObjectId(session?.user?.id) }
        ]
      }
    ]
  }).toArray()

  recurringTransactions.map((transaction) => {
    const ruleOptions = RRule.parseString(transaction.recurrenceFreq || "")

    const ruleSet = new RRuleSet()
    
    ruleSet.rrule(
      new RRule({
        ...ruleOptions,
        dtstart: transaction.date,
      })
    )
      
    const dateExceptions: Date[] = []
    const exceptions = transaction.recurrenceExceptions?.filter(exception => {
      //Filter exclusions from exceptions and add them to rule set
      if (exception.excludeOnly) {
        ruleSet.exdate(exception.originalDate)
        return false
      }
      
      //Filter date exceptions and add them to dateExceptions array, exclude original dates
      if (exception.date) {
        dateExceptions.push(exception.date)
        ruleSet.exdate(new Date(exception.originalDate))

        return true
      }

      return true
    })
    
    //Create and add recurring transactions and date exceptions to array
    ruleSet.between(date, getLastDayOfMonth(date), true).concat(dateExceptions).map(recurDate => {

      //Build and add a transaction for each recurrence
      const newTransaction: Transaction = {
        _id: new ObjectId(),
        title: transaction.title,
        date: recurDate,
        amount: transaction.amount,
        account: transaction.account,
        userId: new ObjectId(session?.user?.id),
        recurrenceFreq: transaction.recurrenceFreq,
        parentId: transaction._id,
      }

      //If date is in exceptions array, then apply the exception
      const exception = exceptions?.filter(exception => {
        if (isSameDay(new Date(exception.date || exception.originalDate), recurDate)) return true
      })

      if (exception && exception[0]) {
        Object.keys(exception[0]).forEach(property => {
          if (property !== 'originalDate' && property !== 'excludeOnly' && property !== 'date') {
            newTransaction[property as TransactionProperty] = exception[0][property as RecurrenceExceptionProperty]
          }
        })
      }

      transactions.push(newTransaction)
    })
  })

  return transactions
}