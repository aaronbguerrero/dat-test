'use client'

import { useSession } from "next-auth/react"
import { Box, Button, Typography } from "@mui/material"
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../components/ui/themes/baseTheme'


import BasicToast, { useToast } from "../components/ui/toasts/basicToast"

export default function Test () {
  const { data: session, status, update } = useSession()

  const toast = useToast()

  const sendAlert = () => {
    console.log("open toast")

    toast.open("TEST T", 'success')
  }

  return (
    <ThemeProvider theme={theme}>
      <Box display={'flex'} flexDirection={'column'} gap={4} alignItems={'center'} margin={'1rem'} padding={'1rem'}>
        <Typography variant='h3'>TEST PAGE</Typography>

        <Button variant='contained' onClick={sendAlert}>TEST</Button>
      </Box>

      <BasicToast {...toast} />
    </ThemeProvider>
  )
}