import { 
  Box,
  FormControlLabel, 
  Radio, 
  RadioGroup 
} from "@mui/material"
import { ChangeEvent, useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

interface RecurEditDialogProps { 
  dialogProps: SubmittableDialogProps,
  editType: 'single' | 'future' | 'all',
  setEditType: (editType: 'single' | 'future' | 'all') => void,
  open: (newValue?: string, property?: string) => void,
  property: string,
}

export default function RecurEditDialog ({ 
  dialogProps,
  editType,
  setEditType,
  property,
}: RecurEditDialogProps) {

  const handleEditTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditType(event.target.value as 'single' | 'future' | 'all')
  }

  return (
    <SubmittableDialog
    {...dialogProps}
    >
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
    </SubmittableDialog>
  )
}

export function useRecurEditDialog (
  onSubmit: (editType: 'single' | 'future' | 'all',
  newValue?: string, 
  property?: string) => Promise<boolean>, 
  onCancel?: () => void,
) {
  const [editType, setEditType] = useState<'single' | 'future' | 'all'>('single')
  const [value, setValue] = useState('')
  const [property, setProperty] = useState('')
  
  const handleOpen = (newValue?: string, property?: string) => {
    setValue(newValue || '')
    setProperty(property || 'date')

    dialogHook.open()
  }
  
  const handleSubmit = async () => {
    const response = onSubmit(editType, value, property)
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
  } 

  return dialogProps
}