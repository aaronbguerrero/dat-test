'use client'
import { PersonTwoTone } from '@mui/icons-material'
import { AppBar, Avatar, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './ui/themes/baseTheme'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import React, { useState } from 'react'
import SignInDialog, { useSignInDialog } from './ui/dialogs/signInDialog'

export default function NavBar () {
  const { data: session } = useSession()

  const signInDialog = useSignInDialog()

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const isUserMenuOpen = Boolean(userMenuAnchor)
  const handleUserAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!session) signInDialog.open()
    else {
      setUserMenuAnchor(event.currentTarget)
    }
  }
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar position='static'>
        <Toolbar sx={{ justifyContent: 'space-between'}}>
          {/* //TODO: Fix link */}
          <Link style={{'color': 'inherit', 'textDecoration': 'none'}} href='/'>
            <Typography variant='h4'>The Struggle Planner</Typography>
          </Link>

          <IconButton 
          onClick={handleUserAvatarClick}
          size='large'
          aria-controls={isUserMenuOpen ? 'user-menu' : undefined}
          aria-haspopup='true'
          aria-expanded={isUserMenuOpen ? 'true' : undefined}>
            <Avatar src={session?.user?.image ?? ''} sx={{ backgroundColor: 'secondary' }}>
              {session ? null : <PersonTwoTone />}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Menu
      anchorEl={userMenuAnchor}
      id='user-menu'
      open={isUserMenuOpen}
      onClose={handleUserMenuClose}
      onClick={handleUserMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Link href={'/settings'} style={{ color: theme.palette.common.black, textDecoration: 'none' }}>Settings</Link>
        </MenuItem>

        <MenuItem onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</MenuItem>
      </Menu>

      <SignInDialog {...signInDialog} />
    </ThemeProvider>
  )
}