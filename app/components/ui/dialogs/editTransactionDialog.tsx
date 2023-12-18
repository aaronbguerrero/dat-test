import React, { useEffect, useState } from 'react'
import { Button, DialogTitle, Divider, Stack, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSession } from 'next-auth/react'
import Dinero from 'dinero.js'
import removeCurrencyFormat from '../../../lib/removeCurrencyFormat'
import BaseDialog, { BaseDialogProps, useDialog } from './baseDialog'
import { DeleteTwoTone, EventRepeatTwoTone, LoopTwoTone } from '@mui/icons-material'
import ExpenseIncomeButtons from '../buttons/expenseIncomeButtons'
import toMonthString from '../../../lib/dates/toMonthString'
import updateMonthEndingAmount from '../../../lib/updateMonthEndingAmount'
import DeleteTransactionDialog, { DeleteTransactionDialogProps, useDeleteTransactionDialog } from './deleteTransactionDialog'
import BasicToast, { BasicToastProps, useToast } from '../toasts/basicToast'
import RecurEditDialog, { RecurEditDialogProps, useRecurEditDialog } from './recurEditDialog'
import toBasicDateString from '../../../lib/dates/toBasicDateString'
import EditableInputField from '../formElements/editableInputField'
import { z } from 'zod'
import EditableRecurrenceSelector from '../formElements/editableRecurrenceSelector'
import currencySchema from '../../../schemas/currencySchema'

import type { Transaction } from '../../../types'
import type { ScopedMutator } from 'swr/_internal'
import { Session } from 'next-auth'

export type EditTransactionDialogProps = { 
  dialogProps: BaseDialogProps,
  recurEditDialog: RecurEditDialogProps,
  deleteTransactionDialog: DeleteTransactionDialogProps,
  toast: BasicToastProps,
  session: Session | null,
  transaction?: Transaction, 
  open: (transaction: Transaction | undefined) => void,
  close: () => void,
  //--------------
  isEditing: boolean,
  setIsEditing: (isEditing: boolean) => void,
  isRecurring: boolean,
  setIsRecurring: (isRecurring: boolean) => void,
  isAddingRecur: boolean,
  setIsAddingRecur: (isAddingRecur: boolean) => void,
  handleTypeChange: (event: React.MouseEvent<HTMLElement>, value: string) => void,
  handleSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  handleAddRecurrence: (newValue: string, newProperty: string) => Promise<boolean>,
  handleRemoveRecurrence: () => Promise<boolean>,
  handleAddRecurrenceClick: () => void,
}

//1. take data to pass to submit
//2. do any modifications (if needed)
//3. invoke the submit callback (export method so it can be "openDeleteDialog(dataToSubmit)")
  //3a. Set/unset loading state, etc.

export default function EditTransactionDialog ({ 
  dialogProps,
  recurEditDialog,
  deleteTransactionDialog,
  toast,
  session,
  transaction, 
  close,
  //--------------
  isEditing,
  setIsEditing,
  isRecurring,
  setIsRecurring,
  isAddingRecur,
  setIsAddingRecur,
  handleTypeChange,
  handleSubmit,
  handleAddRecurrence,
  handleRemoveRecurrence,
  handleAddRecurrenceClick,
}: EditTransactionDialogProps) {

  const theme = useTheme()

  if (!transaction) return null
  
  //Validation
  const amountSchema = currencySchema(session?.user?.currencyUsed || "USD", (transaction.amount.amount < 0) ? 'negative' : 'positive')
  const titleSchema = z.string()

  return (
    <>
      <BaseDialog 
      borderColor={
        (transaction.amount.amount < 0) 
        ? 
        theme.palette.tertiary.main 
        : 
        theme.palette.primary.main
      }
      {...dialogProps}
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
          onSubmit={(newValue, property) => handleSubmit(newValue, property)}
          schema={titleSchema}
          disabled={isEditing}
          isEditingFlag={(isEditing) => setIsEditing(isEditing)}
          />

          <EditableInputField 
          label='Date'
          id='date'
          value={toBasicDateString(new Date(transaction.date))}
          onSubmit={(newValue, property) => handleSubmit(newValue, property)}
          //Don't need schema since date type input handles formatting
          type='date'
          disabled={isEditing}
          isEditingFlag={(isEditing) => setIsEditing(isEditing)}
          />

          <EditableInputField 
          label='Amount'
          id='amount'
          value={Dinero(transaction.amount).toFormat()}
          onSubmit={(newValue, property) => handleSubmit(newValue, property)}
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
            transaction={transaction}
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
          onClick={() => deleteTransactionDialog.open(transaction)}
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

export function useEditTransactionDialog(mutate: ScopedMutator) {
  const toast = useToast()
  const dialogHook = useDialog()

  const { data: session } = useSession()
  useEffect(() => {
    if (!session?.user) toast.open("Could not load user data, please refresh page.", 'error')
    else toast.close()
  }, [session, toast])

  const [transaction, setTransaction] = useState<Transaction>()

  //States and handlers
  const [isEditing, setIsEditing] = useState(false)
  
  const [isRecurring, setIsRecurring] = useState<boolean>((transaction?.recurrenceParentId || transaction?.isRecurring) ? true : false)
  const [isAddingRecur, setIsAddingRecur] = useState<boolean>(false)

  const handleClose = () => {
    dialogHook.close()
    setIsEditing(false)
    setIsAddingRecur(false)
  }
  
  const handleOpen = (transaction: Transaction | undefined) => {
    if (transaction?.recurrenceParentId || transaction?.isRecurring) setIsRecurring(true)
    else setIsRecurring(false)

    setTransaction(transaction)

    dialogHook.open()
  }

  const handleTypeChange = (event: React.MouseEvent<HTMLElement>, value: string) => {
    if (transaction) {
      if (value === 'null') return
      if (value === 'income') return handleSubmit(Math.abs(transaction.amount.amount).toString(), 'amount')
      if (value === 'expense') return handleSubmit((-transaction.amount.amount).toString(), 'amount')
    }

    else return false
  }

  const handleAddRecurrenceClick = () => {
    setIsAddingRecur(true)
    setIsEditing(true)
  }

  const handleAddRecurrence = async (newValue: string, newProperty: string) => {
    if (!transaction) return false

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
    if (!transaction) return false

    const response = await fetch(`/api/transactions/removeRecurrenceFromTransaction/${transaction.recurrenceParentId}`)
      .then(response => response.json())
      .then(response => {
        if (response === true) {
          handleClose()

          mutate(`/api/transactions/getTransactions/${toMonthString(new Date(transaction.date))}`)
          
          toast.open("Recurrence removed successfully!", 'success')

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

  const handleUpdateTransaction = async (
    value: string, property: 
    string
  ) => {
    if (!transaction) return false

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
    if (!newValue || !property || !transaction) return false

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

  const handleSubmit = async (
    newValue: string, 
    property: string | undefined
  ) => {
    if (property === undefined) {
      toast.open('Sorry! There was a problem updating the transaction. Please try again.', 'error')
      return false
    }

    //Setup payload data
    let value = newValue

    if (property === 'amount') value = removeCurrencyFormat(newValue).toString()

    //If transaction is recurring, edit recurrence
    if (isRecurring && property !== 'freq') {
      recurEditDialog.open(transaction, value, property)
      return true
    }
    
    //If not, just edit transaction
    else {
      return handleUpdateTransaction(value, property)
    }

  }

  const handleDelete = async (
    editType?: 'single' | 'future' | 'all'
    ) => {
    if (!transaction) return false

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

  const dialogProps: EditTransactionDialogProps = {
    dialogProps: dialogHook,
    toast: toast,
    session: session,
    transaction: transaction,
    open: handleOpen,
    close: handleClose,
    recurEditDialog: recurEditDialog,
    deleteTransactionDialog: deleteTransactionDialog,
    isEditing: isEditing,
    setIsEditing: setIsEditing,
    isRecurring: isRecurring,
    setIsRecurring: setIsRecurring,
    isAddingRecur: isAddingRecur,
    setIsAddingRecur: setIsAddingRecur,
    handleTypeChange: handleTypeChange,
    handleSubmit: handleSubmit,
    handleAddRecurrence: handleAddRecurrence,
    handleRemoveRecurrence: handleRemoveRecurrence,
    handleAddRecurrenceClick: handleAddRecurrenceClick,
  }

  return dialogProps
}