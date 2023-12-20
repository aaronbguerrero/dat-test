import { Button, Box, SelectChangeEvent, MenuItem } from "@mui/material"
import { ChangeEvent, useEffect, useState } from "react"
import EditableInputField from "../formElements/editableInputField"
import BaseDialog, { BaseDialogProps, useDialog } from "./baseDialog"
import { DeleteTwoTone } from "@mui/icons-material"
import EditableSelect from "../formElements/editableSelect"
import { accountTypes } from '../../../lib/accountTypes'

import type { Account, AccountType } from "../../../types"
import toPrettyAccountType from "../../../lib/toPrettyAccountType"
import EditableColorPicker from "../formElements/editableColorPicker"
import { ModifyResult } from "mongodb"

interface EditAccountDialogProps {
  dialogProps: BaseDialogProps,
  account?: Account,
  open: (account: Account) => void,
  handleSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  handleDelete: () => Promise<boolean>,
  title: string,
  handleTitleChange: (event: ChangeEvent<HTMLInputElement>) => void,
  type: AccountType,
  handleTypeChange: (event: SelectChangeEvent) => void,
  color: string,
  handleColorChange: (color: string) => void,
}

export default function EditAccountDialog ({ 
  dialogProps, 
  account,
  title,
  handleSubmit,
  handleDelete,
  handleTitleChange,
  type, 
  handleTypeChange, 
  color, 
  handleColorChange,
}: EditAccountDialogProps) {
  if (!account) return null

  return (
    <BaseDialog title="Edit Account" {...dialogProps}>
      <Box display='flex' flexDirection='column' gap={2} paddingTop={1}>
          <EditableInputField 
          id='title'
          label="Account Name"
          value={title}
          onSubmit={handleSubmit}
          />

          <EditableSelect 
          id={'type'}
          label="Account Type"
          value={account.type}
          onSubmit={handleSubmit}
          >
            {accountTypes.map(type => {
              return <MenuItem 
              value={type}
              key={type}
              >
                {toPrettyAccountType(type)}
              </MenuItem>
            })}
          </EditableSelect>

          <EditableColorPicker 
          id={'color'}
          value={account.color} 
          format='hex' 
          onSubmit={handleSubmit}
          />

          <Button 
          color='error' 
          variant='contained'
          onClick={handleDelete}
          >
            <DeleteTwoTone />
            Delete Account
          </Button>
        </Box>
    </BaseDialog>
  )
}

export function useEditAccountDialog (
  onSubmit: (account: Account, newValue: string, property: string | undefined) => Promise<ModifyResult<Account>>,
  onDelete: () => Promise<boolean>
) {
  const [account, setAccount] = useState<Account>()
  
  const [title, setTitle] = useState(account?.title || '')
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
  }
  
  //TODO: Different default
  const [type, setType] = useState<AccountType>('checking')
  const handleTypeChange = (event: SelectChangeEvent) => {
    setType(event.target.value as AccountType)
  }
  
  const [color, setColor] = useState('')
  const handleColorChange = (color: string) => {
    setColor(color)
  }

  const handleOpen = (account: Account) => {
    setAccount(account)
    dialogHook.open()
  }

  const handleSubmit = async (newValue: string, property: string | undefined) => {
    if (!account) return false
    
    const response = await onSubmit(account, newValue, property)

    if (response.ok === 1) {
      setAccount(response.value as Account)
      return true
    }
    else return false
  }

  const handleDelete = async () => {
    return await onDelete()
  }

  useEffect(() => {
    if (account) {
      setTitle(account.title)
      setType(account.type)
      setColor(account.color)
    }
  }, [account])

  const dialogHook = useDialog()

  const dialogProps: EditAccountDialogProps = {
    dialogProps: dialogHook,
    account: account,
    open: handleOpen,
    handleSubmit: handleSubmit,
    handleDelete: handleDelete,
    title: title,
    handleTitleChange: handleTitleChange,
    type: type,
    handleTypeChange: handleTypeChange,
    color: color,
    handleColorChange: handleColorChange,
  }

  return dialogProps
}