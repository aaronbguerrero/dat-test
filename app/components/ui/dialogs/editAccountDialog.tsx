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

interface EditAccountDialogProps {
  dialogProps: BaseDialogProps,
  account?: Account,
  open: (account: Account) => void,
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
          id='accountName'
          label="Account Name"
          value={title}
          onSubmit={async () => {return true}}
          />

        <EditableSelect 
        label="Account Type"
        value={account.type}
        onSubmit={async (newValue: string, property: string | undefined) => {return true}}
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
        
        <EditableInputField 
        id='accountName'
        label="Account Name"
        value={title}
        onSubmit={async () => {return true}}
        />

        <EditableColorPicker 
        value={account.color} 
        format='hex' 
        onSubmit={async (newValue: string, property: string | undefined) => {return true}}
        />

        {/* <MuiColorInput value={account.color} format='hex' /> */}
        <EditableColorPicker 
        value={account.color} 
        format='hex' 
        onSubmit={async (newValue: string, property: string | undefined) => {return true}}
        />

          <Button color='error' variant='contained'>
            <DeleteTwoTone />
            Delete Account
          </Button>
        </Box>
    </BaseDialog>
  )
}

export function useEditAccountDialog () {
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
    title: title,
    handleTitleChange: handleTitleChange,
    type: type,
    handleTypeChange: handleTypeChange,
    color: color,
    handleColorChange: handleColorChange,
  }

  return dialogProps
}