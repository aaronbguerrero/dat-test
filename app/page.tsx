'use client'
//TODO: remove use client, need to figure out a better way to redirect

import React, { useState } from "react"

import { useSession } from "next-auth/react"
import { redirect } from 'next/navigation'
import { Button, CardContent, CardHeader } from "@mui/material"
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './components/ui/themes/baseTheme'
import SignInDialog from "./components/ui/dialogs/signInDialog"
import PageCard from "./components/ui/pageCard"
import { MonetizationOnTwoTone } from "@mui/icons-material"

export default function Home() {
  const { data: session, status: authStatus } = useSession()

  const [isSignInOpen, setIsSignInOpen] = useState(false)

  const handleOpenSignIn = () => {
    setIsSignInOpen(true)
  }

  const handleCloseSignIn = () => {
    setIsSignInOpen(false)
  }

  if (authStatus === 'authenticated') {
    redirect('/dashboard')
  }

  //TODO: If no session, have user sign in, if session, redirect to dashboard
  return (
    <ThemeProvider theme={theme}>
      <PageCard>
        <CardHeader 
        title="Welcome to The Struggle Planner, please sign in!" 
        titleTypographyProps={{ textAlign: "center" }}
        />
      
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, }}>
          <MonetizationOnTwoTone color='primary' style={{ fontSize: '10rem'}} />
          <Button 
          variant='contained' 
          onClick={handleOpenSignIn}
          color='secondary'
          >
            Sign In / Create Account
          </Button>
        </CardContent>
      </PageCard>

      <SignInDialog open={isSignInOpen} onClose={handleCloseSignIn} />
    </ThemeProvider>
  )
}
