'use client'

import { useSession } from "next-auth/react"
import { Box, Button, Typography } from "@mui/material"
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../components/ui/themes/baseTheme'
import NewBaseDialog, { useDialog } from "../components/ui/dialogs/baseDialog"
import SubmittableDialog, { useSubmittableDialog } from "../components/ui/dialogs/submittableDialog"


export default function Test () {
  // const { data: session, status, update } = useSession()
  
  const testClose = () => {
    console.log("closed")
  }

  const testSubmit = async () => {
    console.log('submitted')
    return true
  }

  const dialog = useSubmittableDialog(testSubmit, testClose)

  const test = () => {
    console.log("Test")

    dialog.open()
  }

  return (
    <ThemeProvider theme={theme}>
      <Box display={'flex'} flexDirection={'column'} gap={4} alignItems={'center'} margin={'1rem'} padding={'1rem'}>
        <Typography variant='h3'>TEST PAGE</Typography>

        <Button variant='contained' onClick={test}>TEST</Button>
      </Box>

      <SubmittableDialog {...dialog}>
        TEST DIALOG
      </SubmittableDialog>

    </ThemeProvider>
  )
}