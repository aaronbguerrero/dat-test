import { Db, ObjectId } from "mongodb"
import getNextMonth from "./dates/getNextMonth"
import { RRule, RRuleSet } from "rrule"
import getLastDayOfMonth from "./dates/getLastDayOfMonth"
import toBasicDateString from "./dates/toBasicDateString"

import type { Transaction } from '../types'
import type { Session } from "next-auth"

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
        { "$eq": [ "$isRecurring", true ]},
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

    //Add exclusions to rule set
    transaction.recurrenceExclusions?.map(exclusion => ruleSet.exdate(exclusion))

    //Create and add recurring transactions to array
    ruleSet.between(date, getLastDayOfMonth(date), true).map(recurDate => {
      //Build and add a transaction for each recurrence
      const newTransaction: Transaction = {
        _id: transaction._id + '-' + toBasicDateString(recurDate),
        title: transaction.title,
        date: recurDate,
        allDay: true,
        amount: transaction.amount,
        account: transaction.account,
        recurrenceId: transaction.recurrenceId,
        recurrenceParentId: transaction._id.toString(),
        recurrenceFreq: transaction.recurrenceFreq,
      }

      transactions.push(newTransaction)
    })
  })

  return transactions
}