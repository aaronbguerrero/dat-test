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

export interface Account {
  readonly _id: ObjectId,
  readonly userId: ObjectId,
  title: string,
  type: AccountType,
  color: string,
}

export interface Transaction {
  readonly _id: ObjectId,
  title: string,
  date: Date,
  account: Account._id,
  allDay: boolean,
  amount: { amount: number, currency: Dinero.Currency },
  isRecurring?: boolean,
  recurrenceId?: ObjectId,
  recurrenceFreq?: string,
  recurrenceExclusions?: Date[],
  recurrenceParentId?: ObjectId,
}