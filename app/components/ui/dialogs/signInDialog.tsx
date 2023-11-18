import { Box, Button, DialogContent, DialogTitle, Divider, TextField, Typography } from "@mui/material"
import { signIn } from "next-auth/react"
import { FormEvent } from "react"
import BaseDialog from "./baseDialog"

interface EmailFormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
}

interface EmailForm extends HTMLFormElement {
  readonly elements: EmailFormElements;
}

export default function SignInDialog ({ open, onClose }: { open: boolean, onClose: () => void }) {
  const onEmailSubmit = (event: FormEvent<EmailForm>) => {
    event.preventDefault()
    const email = event.currentTarget.elements.email.value
    signIn('email', { email })
  }
  
  return (
    <BaseDialog open={open} onClose={onClose}>
      <DialogTitle align='center' color='secondary'>Sign In</DialogTitle>

      <DialogContent>
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
      </DialogContent>
    </BaseDialog>
  )
}

//TODO: Add message after OTP sents