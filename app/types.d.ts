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
export type RecurrenceExceptionType = 'title' | 'date' | 'amount' | 'account' | 'exclude'

export interface RecurrenceException {
  date: Date,
  property: RecurrenceExceptionType,
  value?: string | Date | ObjectId | { amount: number, currency: Dinero.Currency },
} 

export interface Account {
  readonly _id: ObjectId,
  readonly userId: ObjectId,
  title: string,
  type: AccountType,
  color: string,
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