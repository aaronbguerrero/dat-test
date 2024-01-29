import { Button, Box, MenuItem, FormControlLabel, Checkbox, Tooltip } from "@mui/material"
import { useState } from "react"
import EditableInputField from "../formElements/editableInputField"
import BaseDialog, { BaseDialogProps, useDialog } from "./baseDialog"
import { DeleteTwoTone } from "@mui/icons-material"
import EditableSelect from "../formElements/editableSelect"
import { accountTypes } from '../../../lib/accountTypes'

import type { Account } from "../../../types"
import toPrettyAccountType from "../../../lib/toPrettyAccountType"
import EditableColorPicker from "../formElements/editableColorPicker"
import { ModifyResult } from "mongodb"
import DeleteAccountDialog, { DeleteAccountDialogProps, useDeleteAccountDialog } from "./deleteAccountDialog"
import ConfirmationDialog, { ConfirmationDialogProps, useConfirmationDialog } from "./confirmationDialog"

interface EditAccountDialogProps {
  dialogProps: BaseDialogProps,
  confirmationDialog: ConfirmationDialogProps,
  deleteAccountDialog: DeleteAccountDialogProps,
  account?: Account,
  open: (account: Account) => void,
  close: () => void,
  handleSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  handleDelete: () => void,
}

export default function EditAccountDialog ({ 
  dialogProps, 
  confirmationDialog,
  deleteAccountDialog,
  account,
  handleSubmit,
  handleDelete,
}: EditAccountDialogProps) {
  if (!account) return null

  const handleDefaultAccountClick = () => {
    if (account.isDefault) return 
    else confirmationDialog.open("", "Are you sure you'd like to set this to the default account?")
  }

  return (
    <BaseDialog title="Edit Account" {...dialogProps}>
      <Box display='flex' flexDirection='column' gap={2} paddingTop={1} alignItems='start'>
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

          <Tooltip 
          title={account.isDefault ? 'You cannot remove the default status from this account without making another account the default first.' : null}
          placement='right'
          
          >
          <FormControlLabel 
          control={
            <Checkbox 
            checked={account.isDefault || false} 
            onClick={handleDefaultAccountClick}
            disabled={account.isDefault || false}
            />
          } 
          label="Default Account?" 
          labelPlacement="start"
          />
          </Tooltip>

          <Button 
          color='error' 
          variant='contained'
          onClick={handleDelete}
          >
            <DeleteTwoTone />
            Delete {account.title}
          </Button>
        </Box>

        <ConfirmationDialog {...confirmationDialog} />
        <DeleteAccountDialog {...deleteAccountDialog} />
    </BaseDialog>
  )
}

export function useEditAccountDialog (
  onSubmit: (account: Account, newValue: string, property: string | undefined) => Promise<ModifyResult<Account>>,
  onDefaultAccountChange: (account: Account) => Promise<ModifyResult<Account>>,
  onDelete: (account: Account) => Promise<boolean>,
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

  const handleChangeDefaultAccount = async () => {
    if (!account) return false

    const response = await onDefaultAccountChange(account)
    
    if (response.ok === 1) {
      setAccount(response.value as Account)

      return true
    }

    else return false
  }

  const handleDelete = async () => {
    if (account) deleteAccountDialog.open(account)
  }

  const confirmationDialog = useConfirmationDialog(handleChangeDefaultAccount)
  const deleteAccountDialog = useDeleteAccountDialog(onDelete)

  const dialogHook = useDialog()

  const dialogProps: EditAccountDialogProps = {
    dialogProps: dialogHook,
    deleteAccountDialog: deleteAccountDialog,
    confirmationDialog: confirmationDialog,
    account: account,
    open: handleOpen,
    close: handleClose,
    handleSubmit: handleSubmit,
    handleDelete: handleDelete,
  }

  return dialogProps
}