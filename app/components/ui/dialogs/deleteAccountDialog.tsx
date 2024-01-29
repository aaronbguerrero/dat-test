import { useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

import type { Account } from "../../../types"
import { Box, Typography } from "@mui/material"
import AccountIcon from "../accountIcon"

export interface DeleteAccountDialogProps { 
  dialogProps: SubmittableDialogProps,
  open: (account: Account) => void,
  account: Account | undefined,
}

export default function DeleteAccountDialog ({ 
  dialogProps,
  account,
}: DeleteAccountDialogProps) {

  return (
    <SubmittableDialog
    submitDisabled={account?.isDefault}
    title={account?.isDefault ? "You cannot delete the default account!" : "Are you sure you'd like to delete this account?"}
    actionLabel="Delete"
    actionColor='error'
    cancelColor='secondary'
    {...dialogProps}
    >
      <Box display='flex' flexDirection='column' alignItems='center' gap={4}>
        <Typography color='error'>
          {account?.isDefault? "Please make another account the default before continuing." : "All transactions associated with this account will also be deleted!"}
        </Typography>
        
        {
          !account?.isDefault &&

          <Box display='flex' alignItems='center'>
            <AccountIcon color={account?.color} type={account?.type || 'checking'} />
            <Typography sx={{ color: account?.color, marginLeft: '0.5rem' }} variant='h5'>{account?.title}</Typography>
          </Box>
        }
      </Box>
    </SubmittableDialog>
  )
}

export function useDeleteAccountDialog (onDelete: (account: Account) => Promise<boolean>) {
  const [account, setAccount] = useState<Account>()
  
  const handleDelete = async () => {
    if (account) {
      const response = onDelete(account)
      return response
    }

    else return false
  }

  const handleCancel = () => {
  }

  const dialogHook = useSubmittableDialog(handleDelete, handleCancel)
  
  const handleOpen = (account: Account) => {
    if (account) setAccount(account)
    dialogHook.open()
  }

  const dialogProps: DeleteAccountDialogProps = {
    dialogProps: dialogHook,
    open: handleOpen,
    account: account,
  } 

  return dialogProps
}