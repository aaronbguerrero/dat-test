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
    $expr: {
      $and: [
        { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
        { "$eq": [{ "$month": "$date" }, month ]},
        { "$eq": [{ "$year": "$date" }, year ]},
        { "$eq": [ "$isRecurring", false ]}, //Do not include the original recurring transactions, they will be setup by the recurring rule
      ]
    }
  }).toArray()

  //Get recurring transactions and add to array
  const recurringTransactions = await db.collection<Transaction>("transactions").find({
    $expr: {
      $and: [
        { "$eq": [ "$userId", new ObjectId(session?.user?.id) ]},
        { "$ne": [ "$recurrenceFreq", undefined ]},
        { $lte: [{ $toDate: "$date" }, getNextMonth(date)]},
      ]
    }
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

    //Filter exclusions from exceptions and add them to rule set
    const exceptions = transaction.recurrenceExceptions?.filter(exception => {
      if (exception.property === 'exclude') {
        ruleSet.exdate(exception.date)
        return false
      }

      return true
    })

    //Create and add recurring transactions to array
    ruleSet.between(date, getLastDayOfMonth(date), true).map(recurDate => {
      //Build and add a transaction for each recurrence
      const isParent = isSameDay(recurDate, transaction.date)

      const newTransaction: Transaction = {
        _id: (isParent) ? transaction._id : new ObjectId(),
        title: transaction.title,
        date: recurDate,
        amount: transaction.amount,
        account: transaction.account,
        userId: new ObjectId(session?.user?.id),
        recurrenceFreq: transaction.recurrenceFreq,
        isParent: isParent,
        ...(!isParent) && {parentId: transaction._id}
      }

      //If date is in exceptions array, then apply the exception
      exceptions?.filter(exception => {
        if (isSameDay(exception.date, recurDate)) return true
      })
      .map(exception => {
        newTransaction[exception.property as "title" | "date" | "account" | "amount"] = exception.value
      })

      transactions.push(newTransaction)
    })
  })

  return transactions
}