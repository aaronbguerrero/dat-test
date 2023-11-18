import React, { useEffect, useState } from 'react'
import { Button, DialogTitle, Divider, FormControlLabel, Stack, Switch, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSession } from 'next-auth/react'
import Dinero from 'dinero.js'
import removeCurrencyFormat from '../../../lib/removeCurrencyFormat'
import BaseDialog from './baseDialog'
import { DeleteTwoTone, EventRepeatTwoTone, LoopTwoTone } from '@mui/icons-material'

import ExpenseIncomeButtons from '../buttons/expenseIncomeButtons'

import { ScopedMutator } from 'swr/_internal'
import toMonthString from '../../../lib/dates/toMonthString'
import updateMonthEndingAmount from '../../../lib/updateMonthEndingAmount'
import DeleteTransactionDialog, { useDeleteTransactionDialog } from './deleteTransactionDialog'

import BasicToast, { useToast } from '../toasts/basicToast'
import RecurEditDialog, { useRecurEditDialog } from './recurEditDialog'
import type { Transaction } from '../../../api/transactions/getTransactions/[slug]/route'
import toBasicDateString from '../../../lib/dates/toBasicDateString'
import EditableInputField from '../formElements/editableInputField'
import { z } from 'zod'
import EditableRecurrenceSelector from '../formElements/editableRecurrenceSelector'
import currencySchema from '../../../schemas/currencySchema'

type Props = { 
  isOpen: boolean, 
  setIsOpen: (isOpen: boolean) => void, 
  content: Transaction, 
  mutate: ScopedMutator,
}

//1. take data to pass to submit
//2. do any modifications (if needed)
//3. invoke the submit callback (export method so it can be "openDeleteDialog(dataToSubmit)")
  //3a. Set/unset loading state, etc.

export default function TransactionEditDialog ({ isOpen, setIsOpen, content: transaction, mutate }: Props) {
  const toast = useToast()

  const { data: session } = useSession()
  if (!session?.user) toast.open("Could not load user data, please refresh page.", 'error')
  
  const theme = useTheme()

  //States and handlers
  const [isEditing, setIsEditing] = useState(false)
  
  const handleClose = () => {
    setIsOpen(false)
    setIsEditing(false)
    setIsAddingRecur(false)
  }
  
  const [isRecurring, setIsRecurring] = useState<boolean>((transaction.recurrenceParentId || transaction.isRecurring) ? true : false)
  const [isAddingRecur, setIsAddingRecur] = useState<boolean>(false)
  useEffect(() => {
    if (transaction.recurrenceParentId || transaction.isRecurring) setIsRecurring(true)
    else setIsRecurring(false)
  }, [transaction])

  const handleTypeChange = (event: React.MouseEvent<HTMLElement>, value: string) => {
    if (value === 'null') return
    if (value === 'income') return handleSubmit(Math.abs(transaction.amount.amount).toString(), 'Amount')
    if (value === 'expense') return handleSubmit((-transaction.amount.amount).toString(), 'Amount')
  }

  const handleAddRecurrenceClick = () => {
    setIsAddingRecur(true)
    setIsEditing(true)
  }

  const handleAddRecurrence = async (newValue: string, newProperty: string) => {
    const response = await fetch(`/api/transactions/addRecurrenceToTransaction/${transaction._id}/${newValue}`)
      .then(response => response.json())
      .then(response => {
        if (response === true) {
          mutate(`/api/transactions/getTransactions/${toMonthString(new Date(transaction.date))}`)
          
          toast.open("Recurrence added successfully!", 'success')

          setIsAddingRecur(false)
          setIsEditing(false)

          return true
        } 
        else {
          toast.open('Sorry! There was a problem adding recurrence to the transaction. Please try again.', 'error')
          
          setIsAddingRecur(true)
          setIsEditing(true)

          return false
        }
      })

      return response
  }

  const handleRemoveRecurrence = async () => {
    const response = await fetch(`/api/transactions/removeRecurrenceFromTransaction/${transaction.recurrenceParentId}`)
      .then(response => response.json())
      .then(response => {
        if (response === true) {
          mutate(`/api/transactions/getTransactions/${toMonthString(new Date(transaction.date))}`)
          
          toast.open("Recurrence removed successfully!", 'success')

          setIsAddingRecur(false)
          setIsEditing(false)

          handleClose()

          return true
        } 
        else {
          toast.open('Sorry! There was a problem removing the recurrence from the transaction. Please try again.', 'error')
          
          setIsAddingRecur(true)
          setIsEditing(true)

          return false
        }
      })

      return response
  }

  const handleUpdateTransaction = async (value: string, property: string) => {
    //Update transaction and display/return result
    let id = transaction._id
    if (property === 'recurrenceFreq') {
      id = transaction.recurrenceParentId || transaction._id
    }

    const response = await fetch(`/api/transactions/updateTransaction/${id}/${property}/${encodeURIComponent(value)}/${session?.user?.currencyUsed}`)
    .then(response => response.json())
    .then(response => {
      if (response === true) {
        const monthString = toMonthString(new Date(transaction.date))

        mutate(`/api/transactions/getTransactions/${toMonthString(new Date(transaction.date))}`)

        updateMonthEndingAmount(monthString)
        .then(response => {
          if (response === true) mutate(`/api/months/getMonthData/${monthString}`)
          else toast.open("Sorry! There was a problem calculating the month ending amount, but the transaction was updated. Please refresh the page.", 'error')
        })
        
        toast.open("Transaction updated successfully!", 'success')

        return true
      } 
      else {
        toast.open('Sorry! There was a problem updating the transaction. Please try again.', 'error')
        return false
      }
    })

    return response
  }
  
  const handleUpdateRecurringTransaction = async (
    editType: 'single' | 'future' | 'all', 
    newValue?: string, 
    property?: string
  ) => {
    //Check to make sure payload is there
    if (!newValue || !property) return false

    const monthString = toMonthString(new Date(transaction.date))

    const response = await fetch(`/api/transactions/updateRecurringTransaction/${editType}/${transaction.recurrenceParentId}/${transaction.date}/${property}/${encodeURIComponent(newValue)}/${session?.user?.currencyUsed}`)
    .then(response => response.json())
    .then(response => {
      if (response === true) {
        mutate(`/api/transactions/getTransactions/${monthString}`)

        updateMonthEndingAmount(monthString)
        .then(response => {
          if (response === true) mutate(`/api/months/getMonthData/${monthString}`)
          else toast.open("Sorry! There was a problem calculating the month ending amount, but the transaction was updated. Please refresh the page.", 'error')
        })

        toast.open("Transaction(s) updated successfully!", 'success')

        return true
      }

      else {
        toast.open('Sorry! There was a problem updating the transaction(s). Please try again.', 'error')
        return false
      }
    })

    return response
  }

  const handleSubmit = async (newValue: string, property: string | undefined) => {
    if (property === undefined) {
      toast.open('Sorry! There was a problem updating the transaction. Please try again.', 'error')
      return false
    }

    //Setup payload data
    let value = newValue

    if (property === 'amount') value = removeCurrencyFormat(newValue).toString()

    //If transaction is recurring, edit recurrence
    if (isRecurring && property !== 'freq') {
      recurEditDialog.open(value, property)
      return true
    }
    
    //If not, just edit transaction
    else {
      return handleUpdateTransaction(value, property)
    }

  }

  const handleDelete = async (editType?: 'single' | 'future' | 'all') => {
    const monthString = toMonthString(new Date(transaction.date))
    
    let response
    if (isRecurring) {
      response = await fetch(`/api/transactions/deleteRecurringTransaction/${editType}/${transaction.recurrenceParentId}/${transaction.date}`)
      .then(response => response.json())
    } 
    else {
      response = await fetch(`/api/transactions/deleteTransaction/${transaction._id}`)
      .then(response => response.json())
    }
    
    if (response === true) {
      handleClose()
      
      mutate(`/api/transactions/getTransactions/${monthString}`)
      
      updateMonthEndingAmount(monthString)
      .then(response => {
        if (response === true) mutate(`/api/months/getMonthData/${monthString}`)
        else toast.open("Sorry! There was a problem calculating the month ending amount, but the transaction was deleted. Please refresh the page.", 'error')
      })
      
      
      toast.open("Transaction(s) deleted successfully!", 'success')
    } 
    
    else {
      toast.open('Sorry! There was a problem deleting the transaction(s). Please try again.', 'error')
    }

    return response
  }

  const recurEditDialog = useRecurEditDialog(handleUpdateRecurringTransaction)
  const deleteTransactionDialog = useDeleteTransactionDialog(handleDelete)
  
  //Validation
  const amountSchema = currencySchema(session?.user?.currencyUsed || "USD", (transaction.amount.amount < 0) ? 'negative' : 'positive')
  const titleSchema = z.string()

  return (
    <>
      <BaseDialog 
      open={isOpen} 
      onClose={handleClose}
      borderColor={(transaction.amount.amount < 0) ? theme.palette.tertiary.main : theme.palette.primary.main}
      >
        <DialogTitle display={'flex'} alignItems='center'>
          {transaction.title}

          {(
            transaction.recurrenceId && 
            
            <Tooltip title="This transaction is part of a recurring series">
              <EventRepeatTwoTone 
              fontSize='small' 
              color='info' 
              sx={{ marginLeft: '1rem' }} 
              />
            </Tooltip>
          )}  
        </DialogTitle>

        <Divider />

        <Stack spacing={2} padding='1rem' overflow='hidden'>
          <ExpenseIncomeButtons 
          value={(transaction.amount.amount < 0) ? 'expense' : 'income'} 
          onChange={handleTypeChange}
          fullWidth
          disabled={isEditing}
          />

          <EditableInputField 
          label='Title'
          id='title'
          value={transaction.title}
          onSubmit={handleSubmit}
          schema={titleSchema}
          disabled={isEditing}
          isEditingFlag={(isEditing) => setIsEditing(isEditing)}
          />

          <EditableInputField 
          label='Date'
          id='date'
          value={toBasicDateString(new Date(transaction.date))}
          onSubmit={handleSubmit}
          //Don't need schema since date type input handles formatting
          type='date'
          disabled={isEditing}
          isEditingFlag={(isEditing) => setIsEditing(isEditing)}
          />

          <EditableInputField 
          label='Amount'
          id='amount'
          value={Dinero(transaction.amount).toFormat()}
          onSubmit={handleSubmit}
          schema={amountSchema}
          disabled={isEditing}
          isEditingFlag={(isEditing) => setIsEditing(isEditing)}
          />

          {
            (!isRecurring && !isAddingRecur) && 

            <Button
            color='secondary' 
            variant='contained'
            onClick={handleAddRecurrenceClick}
            disabled={isEditing}
            >
              <LoopTwoTone />
              Recurrence
            </Button>
          }

          {
            (isRecurring || isAddingRecur) && 
            
            <EditableRecurrenceSelector 
            value={transaction.recurrenceFreq || ''} 
            id='recurrenceFreq'
            onSubmit={isAddingRecur ? handleAddRecurrence : handleSubmit}
            onRemove={handleRemoveRecurrence}
            date={transaction.date}
            disabled={isEditing}
            isEditingFlag={(isEditing) => {
              setIsEditing(isEditing)
              if (isEditing === false) setIsAddingRecur(false)
            }}
            editOnOpen={!isRecurring}
            />
          }

          <Button 
          color='error' 
          variant='contained'
          onClick={() => deleteTransactionDialog.open()}
          disabled={isEditing}
          >
            <DeleteTwoTone />
            Delete 
          </Button>
        </Stack>
      </BaseDialog>

      <RecurEditDialog 
      {...recurEditDialog}
      />

      <DeleteTransactionDialog 
      {...deleteTransactionDialog}
      isRecurring={isRecurring}
      />

      <BasicToast {...toast} />
    </>
  )
}