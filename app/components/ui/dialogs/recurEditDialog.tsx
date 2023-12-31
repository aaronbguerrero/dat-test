import { 
  Box,
  FormControlLabel, 
  Radio, 
  RadioGroup, 
  Typography
} from "@mui/material"
import { ChangeEvent, useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

import type { Transaction } from "../../../types"
import { WarningTwoTone } from "@mui/icons-material"

export interface RecurEditDialogProps { 
  dialogProps: SubmittableDialogProps,
  editType: 'single' | 'future' | 'all',
  setEditType: (editType: 'single' | 'future' | 'all') => void,
  open: (transaction?: Transaction, newValue?: string, property?: string, date?: string) => void,
  property: string,
  isParent?: boolean,
}

export default function RecurEditDialog ({ 
  dialogProps,
  editType,
  setEditType,
  property,
  isParent,
}: RecurEditDialogProps) {

  const handleEditTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditType(event.target.value as 'single' | 'future' | 'all')
  }

  return (
    <SubmittableDialog
    {...dialogProps}
    >
      {
        isParent &&

        <Box display='flex' flexDirection='column' alignItems='center' textAlign='center' gap={4}>
          <WarningTwoTone color='warning' style={{ fontSize: '5rem'}} />

          <Typography variant='h5'>
            Since this is the parent of a recurring series, this edit will apply to all of the following transactions in the series.
          </Typography>
        </Box>
      }

      {
        !isParent && 

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

          <FormControlLabel 
          value='future' 
          label="Edit this and all future occurrences of this transaction" 
          control={<Radio />} 
          />  

          {
            (property !== 'date') &&
            <FormControlLabel 
            value='all' 
            label="Edit all occurrences of this transaction" 
            control={<Radio />} 
            />
          }
        </RadioGroup>
      </Box>         
      }         
    </SubmittableDialog>
  )
}

export function useRecurEditDialog (
  onSubmit: (
    editType: 'single' | 'future' | 'all', 
    newValue?: string, 
    property?: string,
    transaction?: Transaction,
    date?: string,
  ) => Promise<boolean>, 
  onCancel?: () => void,
) {
  const [transaction, setTransaction] = useState<Transaction>()
  const [editType, setEditType] = useState<'single' | 'future' | 'all'>('single')
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
    if (transaction?.isParent) setEditType('all')
    setValue(newValue || '')
    setProperty(property || 'date')
    setDate(date || '')

    dialogHook.open()
  }
  
  const handleSubmit = async () => {
    const response = onSubmit(editType, value, property, transaction, date)
    .then(response => {
      if (response === true) setEditType('single')
      return response
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
    isParent: transaction?.isParent,
  } 

  return dialogProps
}