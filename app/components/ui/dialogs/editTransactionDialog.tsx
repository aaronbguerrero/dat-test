import { useEffect, useState } from 'react'
import { Box, Button, Stack, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useSession } from 'next-auth/react'
import Dinero from 'dinero.js'
import removeCurrencyFormat from '../../../lib/removeCurrencyFormat'
import BaseDialog, { BaseDialogProps, useDialog } from './baseDialog'
import { DeleteTwoTone, EventRepeatTwoTone, LoopTwoTone } from '@mui/icons-material'
import ExpenseIncomeButtons from '../buttons/expenseIncomeButtons'
import toMonthString from '../../../lib/dates/toMonthString'
import setMonthData from '../../../lib/setMonthData'
import DeleteTransactionDialog, { DeleteTransactionDialogProps, useDeleteTransactionDialog } from './deleteTransactionDialog'
import BasicToast, { BasicToastProps, useToast } from '../toasts/basicToast'
import RecurEditDialog, { RecurEditDialogProps, useRecurEditDialog } from './recurEditDialog'
import toBasicDateString from '../../../lib/dates/toBasicDateString'
import EditableInputField from '../formElements/editableInputField'
import { z } from 'zod'
import EditableRecurrenceSelector from '../formElements/editableRecurrenceSelector'
import currencySchema from '../../../schemas/currencySchema'

import type { RecurrenceEditType, Transaction } from '../../../types'
import { Session } from 'next-auth'
import EditableAccountSelector from '../formElements/editableAccountSelector'
import { DeleteResult, ModifyResult, UpdateResult } from 'mongodb'

export type EditTransactionDialogProps = { 
  dialogProps: BaseDialogProps,
  recurEditDialog: RecurEditDialogProps,
  deleteTransactionDialog: DeleteTransactionDialogProps,
  toast: BasicToastProps,
  session: Session | null,
  transaction?: Transaction, 
  open: (transaction: Transaction | undefined) => void,
  close: () => void,
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
      title={
        <Stack direction='row' alignItems='center'> 
          {transaction.title}

          {(
            isRecurring && 
            <Tooltip title={`This transaction is part of a recurring series`}>
              <Box display='flex' alignItems='center'>
                <EventRepeatTwoTone 
                fontSize='small' 
                color='info' 
                sx={{ marginLeft: '1rem' }} 
                />
              </Box>
            </Tooltip>
          )}
        </Stack>
      }
      borderColor={
        (transaction.amount.amount < 0) 
        ? 
        theme.palette.tertiary.main 
        : 
        theme.palette.primary.main
      }
      {...dialogProps}
      >
        <Stack spacing={2} overflow='hidden'>
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

          <EditableAccountSelector 
          value={transaction.account}
          onSubmit={handleSubmit} 
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
              Add Recurrence
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

export function useEditTransactionDialog(mutate: (key: string) => void, transactions: Transaction[] | undefined) { 
  const cleanupClose = () => {
    setIsEditing(false)
    setIsAddingRecur(false)
  }
  
  const toast = useToast()
  const dialogHook = useDialog(cleanupClose)

  const { data: session } = useSession()
  useEffect(() => {
    if (!session?.user) toast.open("Could not load user data, please refresh page.", 'error')
    else toast.close()
  }, [session, toast])

  //States and handlers
  const [transaction, setTransaction] = useState<Transaction>()
  const [isEditing, setIsEditing] = useState(false)
  const [isRecurring, setIsRecurring] = useState<boolean>((transaction?.recurrenceFreq) ? true : false)
  const [isAddingRecur, setIsAddingRecur] = useState<boolean>(false)
  
  useEffect(() => {
    if (transaction?.recurrenceFreq) setIsRecurring(true)
    else setIsRecurring(false)
  }, [transaction])

  const handleClose = () => {
    dialogHook.close()
    cleanupClose()
  }
  
  const handleOpen = (transactionToOpen: Transaction | undefined) => {
    //Set isRecurring on open to prevent flash from useEffect
    if (transactionToOpen?.recurrenceFreq) setIsRecurring(true)
    else setIsRecurring(false)

    setTransaction(transactions?.find(transaction => transaction._id === transactionToOpen?._id))

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

    const response = await fetch(`/api/transactions/addRecurrenceToTransaction/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        _id: transaction._id,
        rule: newValue,
      })
    })
    .then(response => response.json())
    .then(response => {
      if (response.ok === 1) {
        setTransaction(response.value)
        
        setIsAddingRecur(false)
        setIsEditing(false)
        setIsRecurring(true)

        mutate(`/api/transactions/getTransactions/${toMonthString(new Date(transaction.date))}`)
        
        toast.open("Recurrence added successfully!", 'success')

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
    if (!transaction || transaction === undefined) return false

    const response = await fetch(`/api/transactions/removeRecurrenceFromTransaction/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: transaction.parentId,
      }),
    })
      .then(response => response.json())
      .then(response => {
        if (response.ok === 1) {
          if (transaction._id !== response.value._id) handleClose()

          setTransaction(response.value)

          setIsAddingRecur(false)
          setIsEditing(false)
          setIsRecurring(false)

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
    //TODO: Handle this error better (toast?)
    if (!transaction) return {} as ModifyResult<Transaction>

    //Update transaction and display/return result
    let id = transaction._id
    if (property === 'recurrenceFreq') {
      id = transaction._id
    }

    const response = await fetch(`/api/transactions/updateTransaction/` , { 
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        _id: id,
        property: property,
        value: value,
        currency: session?.user?.currencyUsed,
      }),
    })
    .then(response => response.json())
    .then(response => {
      if (response.ok === 1) {
        const monthString = toMonthString(new Date(transaction.date))

        setTransaction(response.value)

        mutate(`/api/transactions/getTransactions/${toMonthString(new Date(transaction.date))}`)

        setMonthData(monthString)
        .then(response => {
          if (response === true) mutate(`/api/months/getMonthData/${monthString}`)
          else toast.open("Sorry! There was a problem calculating the month ending amount, but the transaction was updated. Please refresh the page.", 'error')
        })
        
        toast.open("Transaction updated successfully!", 'success')
      } 
      else toast.open('Sorry! There was a problem updating the transaction. Please try again.', 'error')
    
      return response
    })

    return response as Promise<ModifyResult<Transaction>>
  }
  
  const handleUpdateRecurringTransaction = async (
    editType: RecurrenceEditType, 
    newValue?: string, 
    property?: string,
    transaction?: Transaction,
  ) => {
    //Check to make sure payload is there
    if (!newValue || !property || !transaction) return {} as ModifyResult<Transaction>

    const monthString = toMonthString(new Date(transaction.date))

    const response: ModifyResult<Transaction> = await fetch(`/api/transactions/updateRecurringTransaction/`, { 
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        _id: transaction._id,
        parentId: transaction.parentId, 
        editType: editType,
        date: transaction.date,
        property: property,
        value: newValue,
        currency: session?.user?.currencyUsed,
      })
    })
    .then(response => response.json())
    .then((response: ModifyResult<Transaction>) => {
      if (response.ok === 1) {
        if (response.value) setTransaction(response.value as Transaction)

        mutate(`/api/transactions/getTransactions/${monthString}`)

        setMonthData(monthString)
        .then(response => {
          if (response === true) mutate(`/api/months/getMonthData/${monthString}`)
          else toast.open("Sorry! There was a problem calculating the month ending amount, but the transaction was updated. Please refresh the page.", 'error')
        })

        toast.open("Transaction(s) updated successfully!", 'success')
      }

      else toast.open('Sorry! There was a problem updating the transaction(s). Please try again.', 'error')
    
      return response
    })

    return response as ModifyResult<Transaction>
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
    if (isRecurring) {
      recurEditDialog.open(transaction, value, property)
      return true
    }
    
    //If not, just edit transaction
    else {
      const response = await handleUpdateTransaction(value, property)

      if (response.ok === 1) return true
      else return false
    }

  }

  const handleDelete = async (
    editType?: RecurrenceEditType
    ) => {
    if (!transaction) return false

    const monthString = toMonthString(new Date(transaction.date))
    
    let response: DeleteResult
    if (isRecurring) {
      response = await fetch(`/api/transactions/deleteRecurringTransaction/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: transaction.parentId,
          editType: editType,
          date: transaction.date,
        }),
      })
      .then(response => response.json())
    } 
    else {
      response = await fetch(`/api/transactions/deleteTransaction/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: transaction._id,
        }),
      })
      .then(response => response.json())
    }
    
    if (response.acknowledged) {
      handleClose()
      
      mutate(`/api/transactions/getTransactions/${monthString}`)
      
      setMonthData(monthString)
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