'use client'

import { Box, Button, Divider, Paper, Skeleton, TextField, Typography } from "@mui/material"
import { ThemeProvider } from "@mui/material/styles"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import CurrencySelector from "../components/ui/formElements/currencySelector"
import PageCard from "../components/ui/pageCard"
import { theme } from '../components/ui/themes/baseTheme'
import BasicToast, { useToast } from "../components/ui/toasts/basicToast"

//TODO: redirect or disable if user already registered

export default function Register () {
  const { data: session, status, update } = useSession()

  const toast = useToast()

  const router = useRouter()

  const [name, setName] = useState('')
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setName(event.target.value)
  }

  const [currency, setCurrency] = useState('USD')
  const handleCurrencyChange = ( event: React.SyntheticEvent, newValue: string | null ) => {
    if (newValue !== null) setCurrency(newValue)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    await fetch(`/api/user/updateUser/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: session?.user?.id,
        property: 'name',
        value: name,
      })
    })
    .then(response => response.json())
    .then(async response => {
      if (response.acknowledged) await update({ name: name })
    })
    .then(async () => {
      await fetch(`/api/user/updateUser/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: session?.user?.id,
          property: 'currencyUsed',
          value: currency,
        })
      })
      .then(response => response.json())
      .then(async response => {
        if (response.acknowledged) {
          await update({ currencyUsed: currency })
          toast.open("User registered!", 'success')

          router.push(`/dashboard`)
        }

        else toast.open("Sorry! There was a problem registering your account. Please try again.", 'error')
      })
    })
  }

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false)
      if (session.user?.name) setName(session.user.name)
    }
  }, [session?.user?.name, status])

  return (
    <ThemeProvider theme={theme}>
      <PageCard>
        
        <Typography variant='h4' color={theme.palette.secondary.main}>Complete Registration</Typography>
        <Typography variant='subtitle2' fontStyle='italic' color={theme.palette.secondary.main}>Don&#39;t worry, you can always change these later in Settings.</Typography>

        <Divider sx={{ marginY: '1rem' }} />

        <Box component='form' display='flex' flexDirection='column' gap={2} onSubmit={handleSubmit}>
          {
            <>
              <Typography variant='h6' color={theme.palette.secondary.main}>
                {isLoading ? <Skeleton /> : "What's your name?"}
              </Typography>
              
              <TextField value={name} onChange={handleNameChange} required/>
            </>
          }

          <Typography variant='h6' color={theme.palette.secondary.main}>
            {isLoading ? <Skeleton /> : "Which currency will you be using?"}
          </Typography>
          
          {isLoading ? <Skeleton height='5rem' /> : 
          <CurrencySelector 
          value={currency}
          onChange={handleCurrencyChange}
          name='currencySelector'
          />
        }

          {isLoading ? <Skeleton height='4rem' /> : <Button fullWidth variant='contained' type='submit'>Get Planning!</Button>}
        </Box>
      </PageCard>

      <BasicToast {...toast} />
    </ThemeProvider>
  )
}