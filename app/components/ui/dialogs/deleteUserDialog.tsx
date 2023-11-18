import { Box, Typography } from "@mui/material"
import InputField from "../formElements/inputField"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"
import { z } from 'zod'
import { ChangeEvent, useState } from "react"
import { theme } from "../themes/baseTheme"

interface DeleteUserDialogProps {
  dialogProps: SubmittableDialogProps,
  open: () => void,
  userEmail: string | null | undefined,
  email: string,
  setEmail: (email: string) => void,
}

export default function DeleteUserDialog ({ dialogProps, userEmail, email, setEmail }: DeleteUserDialogProps) {
  const handleSetEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  return (
    <SubmittableDialog
    borderColor={theme.palette.error.main}
    title="Are you sure you want to delete your account?"
    actionLabel="Delete your account forever!"
    actionColor='error'
    cancelColor='secondary'
    submitDisabled={userEmail !== email}
    {...dialogProps}
    >
      <Box display='flex' flexDirection='column'>
        <Typography variant='subtitle1' color='error' marginBottom={2}>
        This will erase <u>ALL</u> of your data, including all transactions!
      </Typography>

      <InputField 
      value={email}
      onChange={handleSetEmail}
      label="Email Address"
      schema={z.string()}
      autoComplete='off'
      />

      <Typography variant='caption' marginTop={2}>
        Please type in your email address to confirm account deletion.
      </Typography>
      </Box>
      
    </SubmittableDialog>
  )
}

export function useDeleteUserDialog (onDelete: () => Promise<boolean>, userEmail: string | null | undefined) {
  const [email, setEmail] = useState('')
 
  const handleDelete = async () => {
    const response = onDelete()
    return response
  }

  const handleCancel = () => {
    setEmail('')
  }

  const dialogHook = useSubmittableDialog(handleDelete, handleCancel)

  const dialogProps: DeleteUserDialogProps = {
    dialogProps: dialogHook,
    open: dialogHook.open,
    userEmail: userEmail,
    email: email,
    setEmail: setEmail,
  }

  return dialogProps
}