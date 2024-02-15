'use client'

import { useSearchParams } from 'next/navigation'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../components/ui/themes/baseTheme'
import { Alert, AlertTitle, Box, Card, CardHeader } from "@mui/material"
import { Suspense } from 'react'

export default function SignIn () {
  function SignInError () {
    const error = useSearchParams().get('error')
    if (!error) return null
  
    //Parse error message from code (in NextAuth docs)
    let errorMessage = ""
    switch (error) {
      case 'OAuthSignin':
        errorMessage = "Error in constructing an authorization URL."
        break
        
      case 'OAuthCallback':
        errorMessage = "Error in handling the response from OAuth provider."
        break
        
      case 'OAuthCreateAccount':
        errorMessage = "Could not create user in the database."
        break
        
      case 'EmailCreateAccount':
        errorMessage = "Could not create user in the database."
        break
        
      case 'Callback':
        errorMessage = "Error in the OAuth callback handler route"
        break
        
      case 'OAuthAccountNotLinked':
        errorMessage = "The email on the account is already linked, but not with the account you're trying to sign in with."
        break
        
      case 'EmailSignin':
        errorMessage = "Sending the e-mail with the verification token failed"
        break
        
      case 'SessionRequired':
        errorMessage = "The content of this page requires you to be signed in at all times."
        break
    }

    return (
      // error && 
        <Alert severity='error'>
          <AlertTitle>Sorry, there was an problem signing in.</AlertTitle>
          {errorMessage}
        </Alert>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Box padding='1rem' display='flex' justifyContent='center'>
        <Card
        sx={{
          minWidth: { xs: '100%', lg: '30rem' },
          maxWidth: { xs: '100%', lg: '50rem' },
        }}
        >
          <CardHeader title="Sign In" />
            <Suspense>
              <SignInError />
            </Suspense>
          
        </Card>
      </Box>
    </ThemeProvider>
  )
}