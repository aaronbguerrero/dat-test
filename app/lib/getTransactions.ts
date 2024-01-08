import { Db, ObjectId } from "mongodb"
import getNextMonth from "./dates/getNextMonth"
import { RRule, RRuleSet } from "rrule"
import getLastDayOfMonth from "./dates/getLastDayOfMonth"
import toBasicDateString from "./dates/toBasicDateString"

import type { RecurrenceException, Transaction } from '../types'
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
              property: "date",
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
      
    const exceptions = transaction.recurrenceExceptions?.filter(exception => {
      //Filter exclusions from exceptions and add them to rule set
      if (exception.property === 'exclude') {
        ruleSet.exdate(exception.date)
        return false
      }
      
      //Filter date exceptions and add them to rule set
      if (exception.property === 'date') {
        ruleSet.rdate(exception.value as Date)
        ruleSet.exdate(exception.date as Date)
        return false
      }

      return true
    })
    
    //Create and add recurring transactions to array
    ruleSet.between(date, getLastDayOfMonth(date), true).map(recurDate => {

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
      exceptions?.filter(exception => {
        if (isSameDay(exception.date, recurDate)) return true
      })
      .map(exception => {
        newTransaction[exception.property as "title" | "account" | "amount"] = exception.value
      })

      transactions.push(newTransaction)
    })
  })

  return transactions
}