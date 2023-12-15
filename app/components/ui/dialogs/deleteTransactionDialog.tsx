import { 
  Box,
  FormControlLabel, 
  Radio, 
  RadioGroup 
} from "@mui/material"
import { ChangeEvent, useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

import type { Transaction } from "../../../types"

export interface DeleteTransactionDialogProps { 
  isRecurring?: boolean,
  dialogProps: SubmittableDialogProps,
  editType: 'single' | 'future' | 'all',
  setEditType: (editType: 'single' | 'future' | 'all') => void,
  open: (transaction: Transaction) => void,
}

export default function DeleteTransactionDialog ({ 
  isRecurring, 
  dialogProps,
  editType,
  setEditType
}: DeleteTransactionDialogProps) {

  const handleEditTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditType(event.target.value as 'single' | 'future' | 'all')
  }

  return (
    <SubmittableDialog
    title="Are you sure you'd like to delete this transaction?"
    actionLabel="Delete"
    {...dialogProps}
    >
      <Box
      component='form'
      display={isRecurring ? 'flex' : 'none'}
      >
        <RadioGroup value={editType} onChange={handleEditTypeChange}>
          <FormControlLabel 
          value='single' 
          label="Delete only this transaction" 
          control={<Radio />} 
          />  

          <FormControlLabel 
          value='future' 
          label="Delete this and all future occurrences of this transaction" 
          control={<Radio />} 
          />  

          <FormControlLabel 
          value='all' 
          label="Delete all occurrences of this transaction" 
          control={<Radio />} 
          />
        </RadioGroup>
      </Box>          
    </SubmittableDialog>
  )
}

export function useDeleteTransactionDialog (onDelete: (transaction: Transaction | undefined, editType: 'single' | 'future' | 'all') => Promise<boolean>) {
  const [transaction, setTransaction] = useState<Transaction>()
  const [editType, setEditType] = useState<'single' | 'future' | 'all'>('single')
  
  const handleDelete = async () => {
    const response = onDelete(transaction, editType)
    .then(response => {
      if (response === true) setEditType('single')
      return response
    })
    return response
  }
  const handleCancel = () => {
    setEditType('single')
  }

  const dialogHook = useSubmittableDialog(handleDelete, handleCancel)
  
  const handleOpen = (transaction: Transaction) => {
    if (transaction) setTransaction(transaction)
    dialogHook.open()
  }

  const dialogProps: DeleteTransactionDialogProps = {
    dialogProps: dialogHook,
    editType: editType,
    setEditType: setEditType,
    open: handleOpen,
  } 

  return dialogProps
}