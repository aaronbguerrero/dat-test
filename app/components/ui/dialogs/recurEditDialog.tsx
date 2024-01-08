import { 
  Box,
  FormControlLabel, 
  Radio, 
  RadioGroup, 
  Typography
} from "@mui/material"
import { ChangeEvent, useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

import type { RecurrenceEditType, Transaction } from "../../../types"
import { ModifyResult } from "mongodb"
import { WarningTwoTone } from "@mui/icons-material"

export interface RecurEditDialogProps { 
  dialogProps: SubmittableDialogProps,
  editType: 'single' | 'future' | 'all',
  setEditType: (editType: 'single' | 'future' | 'all') => void,
  open: (transaction?: Transaction, newValue?: string, property?: string, date?: string) => void,
  property: string,
  transaction: Transaction | undefined,
}

export default function RecurEditDialog ({ 
  dialogProps,
  editType,
  setEditType,
  property,
  transaction,
}: RecurEditDialogProps) {

  const handleEditTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditType(event.target.value as RecurrenceEditType)
  }

  return (
    <SubmittableDialog
    {...dialogProps}
    >
      {
        ((property === 'date') || (property === 'recurrenceFreq')) &&

        <Box display='flex' flexDirection='column' alignItems='center' textAlign='center' gap={4}>
          <WarningTwoTone color='warning' style={{ fontSize: '5rem'}} />
          {
            (property == 'date') &&

            <Typography variant='h5'>
              Since the date is being changed, this edit will only apply to this occurrence of the transaction.
            </Typography>
          }

          {
            (property == 'recurrenceFreq') &&

            <Typography variant='h5'>
              Since the recurrence rules are being changed, this edit will apply all of the transactions in the series.
            </Typography>
          }
        </Box>
      }

      {
        ((property !== 'date') && (property !== 'recurrenceFreq')) && 

        <Box 
        component='form' 
        display='flex' 
        flexDirection='column' 
        justifyContent='center' 
        gap={2} 
        >
          <RadioGroup value={editType} onChange={handleEditTypeChange}>
            <FormControlLabel 
            value='single' 
            label="Edit only this transaction" 
            control={<Radio />} 
            />  
            
{/* TODO: Reimplement
            <FormControlLabel 
            value='future' 
            label="Edit this and all future occurrences of this transaction" 
            control={<Radio />} 
            />   */}

            <FormControlLabel 
            value='all' 
            label="Edit all occurrences of this transaction" 
            control={<Radio />} 
            />
          </RadioGroup>
        </Box>
      }         
    </SubmittableDialog>
  )
}

export function useRecurEditDialog (
  onSubmit: (
    editType: RecurrenceEditType, 
    newValue?: string, 
    property?: string,
    transaction?: Transaction,
    date?: string,
  ) => Promise<ModifyResult<Transaction>>, 
  onCancel?: () => void,
) {
  const [transaction, setTransaction] = useState<Transaction>()
  const [editType, setEditType] = useState<RecurrenceEditType>('single')
  const [value, setValue] = useState('')
  const [property, setProperty] = useState('')
  const [date, setDate] = useState('')
  
  const handleOpen = (
    transaction?: Transaction, 
    newValue?: string, 
    property?: string,
    date?: string,
  ) => {
    if (transaction) setTransaction(transaction)

    if (property === 'recurrenceFreq') setEditType('all')

    setValue(newValue || '')
    setProperty(property || 'date')
    setDate(date || '')

    dialogHook.open()
  }
  
  const handleSubmit = async () => {
    const response = onSubmit(editType, value, property, transaction, date)
    .then(response => {
      if (response) {
        setEditType('single')

        return true
      }

      else return false
    })
    return response
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    setEditType('single')
  }

  const dialogHook = useSubmittableDialog(handleSubmit, handleCancel)

  const dialogProps: RecurEditDialogProps = {
    dialogProps: dialogHook,
    editType: editType,
    setEditType: setEditType,
    open: handleOpen,
    property: property,
    transaction: transaction,
  } 

  return dialogProps
}