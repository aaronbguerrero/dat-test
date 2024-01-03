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
import DeleteAccountDialog, { DeleteAccountDialogProps, useDeleteAccountDialog } from "./deleteAccountDialog"

interface EditAccountDialogProps {
  dialogProps: BaseDialogProps,
  deleteAccountDialog: DeleteAccountDialogProps,
  account?: Account,
  open: (account: Account) => void,
  close: () => void,
  handleSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  handleDelete: () => void,
}

export default function EditAccountDialog ({ 
  dialogProps, 
  deleteAccountDialog,
  account,
  handleSubmit,
  handleDelete,
}: EditAccountDialogProps) {
  if (!account) return null

  return (
    <BaseDialog title="Edit Account" {...dialogProps}>
      <Box display='flex' flexDirection='column' gap={2} paddingTop={1}>
          <EditableInputField 
          id='title'
          label="Account Name"
          value={account.title}
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
            Delete {account.title}
          </Button>
        </Box>

        <DeleteAccountDialog {...deleteAccountDialog} />
    </BaseDialog>
  )
}

export function useEditAccountDialog (
  onSubmit: (account: Account, newValue: string, property: string | undefined) => Promise<ModifyResult<Account>>,
  onDelete: (account: Account) => Promise<boolean>
) {
  const [account, setAccount] = useState<Account>()

  const handleOpen = (account: Account) => {
    setAccount(account)
    dialogHook.open()
  }

  const handleClose = () => {
    dialogHook.close()
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
    if (account) deleteAccountDialog.open(account)
  }

  const deleteAccountDialog = useDeleteAccountDialog(onDelete)

  const dialogHook = useDialog()

  const dialogProps: EditAccountDialogProps = {
    dialogProps: dialogHook,
    deleteAccountDialog: deleteAccountDialog,
    account: account,
    open: handleOpen,
    close: handleClose,
    handleSubmit: handleSubmit,
    handleDelete: handleDelete,
  }

  return dialogProps
}