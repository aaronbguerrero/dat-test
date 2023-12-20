import { Box, Button, DialogContent, DialogTitle, Divider, TextField, Typography } from "@mui/material"
import { signIn } from "next-auth/react"
import { FormEvent } from "react"
import BaseDialog, { BaseDialogProps, useDialog } from "./baseDialog"

interface EmailFormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
}

interface EmailForm extends HTMLFormElement {
  readonly elements: EmailFormElements;
}

type SignInDialogProps = {
  dialogProps: BaseDialogProps,
  open: () => void,
  close: () => void,
}

export default function SignInDialog ({ dialogProps, open, close }: SignInDialogProps) {
  const onEmailSubmit = (event: FormEvent<EmailForm>) => {
    event.preventDefault()
    const email = event.currentTarget.elements.email.value
    signIn('email', { email })
  }
  
  return (
    <BaseDialog title='Sign In' {...dialogProps}>
      <Box 
      display='flex' 
      flexDirection='column'
      gap='0.5rem'
      padding='0.5rem'
      >
        <Box
        component='form'
        display='flex'
        flexDirection='column'
        gap='0.5rem'
        onSubmit={onEmailSubmit}
        >
          <TextField 
          label="Email Address" 
          id="email"
          />

          <Button 
          variant='contained' 
          color='primary' 
          type='submit'
          >
            One-Time Passcode
          </Button>
        </Box>

        <Divider />

        <Button color='secondary' onClick={() => signIn('google')}>Google</Button>

      </Box>
    </BaseDialog>
  )
}

//TODO: Add message after OTP sents

export function useSignInDialog (onCancel?: () => void) {
  const dialogHook = useDialog()

  const handleOpen = () => {
    dialogHook.open()
  }

  const handleClose = () => {
    dialogHook.close()
    
    if (onCancel) onCancel()
  }

  const dialogProps: SignInDialogProps = {
    dialogProps: dialogHook,
    open: handleOpen,
    close: handleClose,
  }

  return dialogProps
}