import { accountTypes } from './lib/accountTypes'
import { ObjectId } from 'mongodb'

import type { Currency } from 'dinero.js'
import type { DefaultUser } from 'next-auth'
import type { DialogProps, SxProps } from '@mui/material'

declare module 'next-auth' {
  interface Session {
    user?: DefaultUser & {
      id: string | undefined;
      currencyUsed: Currency | undefined;
    }
  }
}

export type AccountType = typeof accountTypes[number]
export type RecurrenceEditType = 'single' | 'future' | 'all'
export type RecurrenceExceptionProperty = 'title' | 'date' | 'amount' | 'account' | 'excludeOnly'

export interface RecurrenceException {
  originalDate: Date,
  date: Date,
  title?: string,
  amount?: { amount: number, currency: Dinero.Currency },
  account?: ObjectId,
  excludeOnly?: boolean,
} 

export interface Account {
  readonly _id: ObjectId,
  readonly userId: ObjectId,
  title: string,
  type: AccountType,
  color: string,
  isDefault?: boolean,
}

export type TransactionProperty = 'title' | 'date' | 'amount' | 'account' | 'recurrenceFreq'

export interface Transaction {
  readonly _id: ObjectId,
  title: string,
  date: Date,
  account: Account._id,
  userId: ObjectId,
  amount: { amount: number, currency: Dinero.Currency },
  recurrenceFreq?: string,
  recurrenceExceptions?: RecurrenceException[],
  parentId?: ObjectId,
}

export interface MonthData {
  readonly _id: ObjectId,
  month: string,
  startingAmount: { amount: number, currency: Dinero.Currency },
  userSetStartingAmount?: boolean,
  endingAmount: { amount: number, currency: Dinero.Currency },
  dailyBalance: { amount: number, currency: Dinero.Currency }[],
  totalExpenses: { amount: number, currency: Dinero.Currency },
  totalIncome: { amount: number, currency: Dinero.Currency },
}