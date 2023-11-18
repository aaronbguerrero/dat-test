'use client'

import { signOut, useSession } from "next-auth/react"
import { Avatar, Box, Button, Card, CardHeader, Divider, Skeleton, Stack, Typography } from "@mui/material"
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../components/ui/themes/baseTheme'
import React, { useEffect, useState } from "react"
import { DeleteTwoTone, PersonTwoTone } from "@mui/icons-material"

import BasicToast, { useToast } from "../components/ui/toasts/basicToast"
import EditableInputField from "../components/ui/formElements/editableInputField"
import EditableCurrencySelector from "../components/ui/formElements/editableCurrencySelector"
import DeleteUserDialog, { useDeleteUserDialog } from "../components/ui/dialogs/deleteUserDialog"
import { z } from "zod"

export default function Settings () {
  const { data: session, status, update } = useSession()

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(false)
    }
  }, [status])

  const toast = useToast()

  const handleSubmit = async (value: string, property: string | undefined) => {
    if (property === undefined) return false

    const response = await fetch(`/api/user/updateUser/${session?.user?.id}/${property}/${encodeURIComponent(value)}`)
    .then(response => response.json()
    .then(async response => {
      if (response === true) {
        await update({ [property || '']: value })

        toast.open("User account updated successfully!", 'success')

        return true
      }

      else {
        toast.open("Sorry! There was a problem updating the user account. Please try again.", 'error')
        return false
      }
    }))

    return response
  }

  const handleCurrencySubmit = async (value: string) => {
    return handleSubmit(value, 'currencyUsed')
  }

  const handleDeleteUser = async () => {
    const response = await fetch(`/api/user/deleteUser/${session?.user?.id || ''}`)
    .then(response => response.json())
    .then(response => {
      if (response === true) {
        toast.open("User account deleted!", 'success')

        signOut({ callbackUrl: '/' })
        
        return true
      }
      else {
        toast.open("Sorry! There was a problem deleting the user account. Please try again.", 'error')
        return false
      }
    })

    return response
  }

  const deleteUserDialog = useDeleteUserDialog(handleDeleteUser, session?.user?.email)

  return (
    <ThemeProvider theme={theme}>
      <Box display={'flex'} flexDirection={'column'} gap={4} alignItems={'center'} margin={'1rem'}>
        {/* TODO: validation on submit!!  */}
        <Card
        sx={{
          minWidth: { xs: '100%', lg: '30rem' },
          maxWidth: { xs: '100%', lg: '50rem' },
        }}
        >
          <CardHeader
          titleTypographyProps={{ color: theme.palette.secondary.main, fontSize: '1.5rem', }}
          title="User Settings" 
          avatar={
            <Avatar src={session?.user?.image ?? ''} sx={{ backgroundColor: 'secondary' }}>
              {session ? null : <PersonTwoTone />}
            </Avatar>
          }
          />

          <Divider />

          <Stack spacing={2} padding='1rem'>
            { isLoading ? 
              <Skeleton height={50} /> 
              :
              <EditableInputField 
              label="Name" 
              id='name'
              value={session?.user?.name || ''}
              onSubmit={handleSubmit}
              schema={z.string()}
              isEditingFlag={(isEditing) => setIsEditing(isEditing)}
              disabled={isEditing}
              />
            }

            { isLoading ? 
              <Skeleton height={50} /> 
              :
              <EditableInputField 
              label="Email Address" 
              id='email'
              value={session?.user?.email || ''}
              onSubmit={handleSubmit}
              //TODO: validate email address on submit
              schema={z.string()}
              isEditingFlag={(isEditing) => setIsEditing(isEditing)}
              disabled={isEditing}
              />
            }

            { isLoading ? 
              <Skeleton height={50} /> 
              :
              <EditableCurrencySelector 
              id='currencyUsed'
              value={session?.user?.currencyUsed || 'USD'} 
              onSubmit={handleCurrencySubmit}
              isEditingFlag={(isEditing) => setIsEditing(isEditing)}
              disabled={isEditing}
              />
            }

            { isLoading ? 
              <Skeleton height={50} /> 
              :
              <Button 
              onClick={() => deleteUserDialog.open()}
              color='error' 
              variant='contained'
              disabled={isEditing}
              >
                <DeleteTwoTone />
                Delete Account 
              </Button>
            }
          </Stack>
        </Card>

        <Card
        sx={{
          minWidth: { xs: '100%', lg: '30rem' },
          maxWidth: { xs: '100%', lg: '50rem' },
        }}
        >
          <CardHeader title="Account Settings (Future)" />

          <Divider />

          <Stack>
            <Typography>Checking</Typography>
            <Typography>Credit Card</Typography>
          </Stack>
        </Card>

        <DeleteUserDialog {...deleteUserDialog} />
      </Box>

      <BasicToast {...toast} />
    </ThemeProvider>
  )
}