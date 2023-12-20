import React, { useEffect, useState } from 'react'
import { 
  Box,
  Button, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  FormControlLabel, 
  ListItemIcon, 
  ListItemText, 
  MenuItem, 
  Switch,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import toPrettyDateString from '../../../lib/dates/toPrettyDateString'
import BaseDialog, { BaseDialogProps, useDialog } from './baseDialog'
import removeCurrencyFormat from '../../../lib/removeCurrencyFormat'
import { Currency } from 'dinero.js'
import { useSession } from 'next-auth/react'
import ExpenseIncomeButtons from '../buttons/expenseIncomeButtons'
import toMonthString from '../../../lib/dates/toMonthString'
import updateMonthEndingAmount from '../../../lib/updateMonthEndingAmount'
import RecurrenceSelector from '../formElements/recurrenceSelector'
import BasicToast, { useToast } from '../toasts/basicToast'
import InputField from '../formElements/inputField'
import { z } from 'zod'
import { CreateTwoTone } from '@mui/icons-material'

import type { ScopedMutator } from 'swr/_internal'
import SpinnerBackdrop from '../spinnerBackdrop'
import currencySchema from '../../../schemas/currencySchema'

import AccountSelector from '../formElements/accountSelector'

export type AddTransactionDialogProps = {
  dialogProps: BaseDialogProps,
  date: Date, 
  mutate: ScopedMutator,
  open: (date: Date) => void,
  close: () => void,
}

export default function AddTransactionDialog ({
  dialogProps,
  date, 
  mutate,
  close,
}: AddTransactionDialogProps) {
  const theme = useTheme()

  const toast = useToast()

  //Get user's currency
  const { data: session } = useSession()
  const [currencyUsed, setCurrencyUsed] = useState<Currency>('USD')
  useEffect(() => {
    if (session?.user?.currencyUsed) {
      setCurrencyUsed(session?.user?.currencyUsed)
    }
  }, [session])

  
  const handleClose = () => {
    close()
    setTransactionType('expense')
    setIsRecurring(false)
    setRecurrence('')
    setIsLoading(false)
  }

  const [transactionType, setTransactionType] = useState<string>('expense')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSetTransactionType = (event: React.MouseEvent<HTMLElement>, newTransactionType: string) => {
    if (newTransactionType) {
      setTransactionType(newTransactionType)
    }
  }
  
  const handleToggleIsRecurring = () => {
    setIsRecurring(!isRecurring)
  }
  
  const handleRecurrenceChange = (rule: string) => {
    setRecurrence(rule)
  }
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsLoading(true)

    const data = new FormData(event.currentTarget)
    let formData = Object.fromEntries(data.entries())

    let amount: number
    if (transactionType === 'expense') amount = -Math.abs(removeCurrencyFormat(formData.amount.toString()))
    else amount = Math.abs(removeCurrencyFormat(formData.amount.toString()))
    
    await fetch(`/api/transactions/addTransaction/${date}/${encodeURIComponent(formData.title.toString())}/${amount}/${formData.account.toString()}/${isRecurring ? recurrence : ''}`)
    .then(response => response.json())
    .then(async response => {
      if (response.acknowledged) {
        mutate(`/api/transactions/getTransactions/${toMonthString(date)}`)

        updateMonthEndingAmount(toMonthString(date))
        .then(response => {
          if (response === true) {
            mutate(`/api/months/getMonthData/${toMonthString(date)}`)
            
            toast.open("Transaction created successfully!", 'success')

            handleClose()
          }

          else toast.open('Sorry! There was a problem updating the month ending amount, but the transaction was created successfully. Please reload the page.', 'error')
        })
      }

      else {
        setIsLoading(false)
        toast.open('Sorry! There was a problem creating the transaction. Please try again.', 'error')
      }
    })
  }

  //Validation and schemas
  const titleSchema = z.string()
  const amountSchema = currencySchema(currencyUsed, (transactionType === 'expense') ? 'negative' : 'positive')

  return (
    <>
      <BaseDialog 
      title='Create Transaction'
      borderColor={
        (transactionType === 'expense') ? 
        theme.palette.tertiary.main 
        : 
        theme.palette.primary.main
      }
      {...dialogProps}
      >
        <SpinnerBackdrop isLoading={isLoading} />
        
        <Box
        display='flex'
        flexDirection='column'
        gap={2}
        >
          <DialogContentText>{toPrettyDateString(date)}</DialogContentText>

          <Box 
          component='form' 
          onSubmit={handleSubmit}
          display='flex'
          flexDirection='column'
          gap={2}
          alignItems='center'
          >
            <ExpenseIncomeButtons 
            value={transactionType} 
            onChange={handleSetTransactionType} 
            fullWidth
            />

            <InputField 
            name='title'
            label='Title'
            schema={titleSchema}
            required
            />

            <InputField 
            name='amount'
            label='Amount'
            schema={amountSchema}
            required
            />

            <AccountSelector required />

            <FormControlLabel 
            control={<Switch checked={isRecurring} color='secondary' />} 
            onChange={handleToggleIsRecurring}
            sx={{margin: 0}} 
            label="Is this a recurring transaction?" 
            labelPlacement='start'
            />

            {isRecurring && 
              <RecurrenceSelector 
              id='recurrenceFreq'
              value={recurrence} 
              onChange={handleRecurrenceChange} 
              date={date}
              />
            }

            <Button 
            type='submit' 
            variant='contained' 
            color='secondary'
            fullWidth
            >
              <CreateTwoTone />
              Create Transaction
            </Button>
          </Box>
        </Box>
      </BaseDialog>

      <BasicToast {...toast} />
    </>
  )
}

export function useAddTransactionDialog (mutate: ScopedMutator) {
  const dialogHook = useDialog()

  const [date, setDate] = useState<Date>(new Date())

  const handleOpen = (date: Date) => {
    setDate(date)
    dialogHook.open()
  }

  const handleClose = () => {
    dialogHook.close()
  }
  
  const dialogProps: AddTransactionDialogProps = {
    dialogProps: dialogHook,
    date: date,
    mutate: mutate,
    open: handleOpen,
    close: handleClose,
  }

  return dialogProps
}