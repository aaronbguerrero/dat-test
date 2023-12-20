import { Box, MenuItem, SelectChangeEvent } from "@mui/material"
import { useTheme } from '@mui/material/styles'
import { ChangeEvent, ChangeEventHandler, useState } from "react"
import InputField from "../formElements/inputField"
import { MuiColorInput } from 'mui-color-input'
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

import type { AccountType } from "../../../types"

interface AddAccountDialogProps {
  dialogProps: SubmittableDialogProps,
  open: () => void,
  title: string,
  handleTitleChange: (event: ChangeEvent<HTMLInputElement>) => void,
  type: AccountType,
  handleTypeChange: ChangeEventHandler<HTMLInputElement>,
  color: string,
  handleColorChange: (color: string) => void,
}

export default function AddAccountDialog ({ 
  dialogProps, 
  title,
  handleTitleChange,
  type, 
  handleTypeChange, 
  color, 
  handleColorChange,
}: AddAccountDialogProps) {

  return (
    <SubmittableDialog
    title="Add Account"
    actionLabel="Submit"
    {...dialogProps}
    >
      <Box display='flex' flexDirection='column' gap={2}>
        <InputField 
        label="Account Name" 
        value={title} 
        onChange={handleTitleChange}
        required 
        />

        <InputField 
        select
        label="Account Type"
        value={type} 
        onChange={handleTypeChange}
        required
        >
          <MenuItem value='checking'>Checking</MenuItem>
          <MenuItem value='creditCard'>Credit Card</MenuItem>
          <MenuItem value='savings'>Savings</MenuItem>
          <MenuItem value='loan'>Loan</MenuItem>
        </InputField>

        <MuiColorInput 
        label="Color"
        required 
        value={color} 
        onChange={handleColorChange} 
        format='hex' 
        />
      </Box>
    </SubmittableDialog>
  )
}

export function useAddAccountDialog (onSubmit: (title: string, type: AccountType, color: string) => Promise<boolean>) {
  const theme = useTheme()

  const [title, setTitle] = useState<string>('')
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
  }

  const [type, setType] = useState<AccountType>('checking')
  const handleTypeChange: ChangeEventHandler<HTMLInputElement> = (event: SelectChangeEvent) => {
    setType(event.target.value as AccountType)
  }

  const [color, setColor] = useState(theme.palette.primary.main)
  const handleColorChange = (color: string) => {
    setColor(color)
  }

  const handleSubmit = async () => {
    const response = onSubmit(title, type, color)
    return response
  }
  const handleCancel = () => {
    setTitle('')
    setType('checking')
    setColor(theme.palette.primary.main)
  }

  const dialogHook = useSubmittableDialog(handleSubmit, handleCancel)

  const dialogProps: AddAccountDialogProps = {
    dialogProps: dialogHook,
    open: dialogHook.open,
    title: title,
    handleTitleChange: handleTitleChange,
    type: type,
    handleTypeChange: handleTypeChange,
    color: color,
    handleColorChange: handleColorChange,
  }

  return dialogProps
}