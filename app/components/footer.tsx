'use client'

import { Box, Typography } from "@mui/material"
import { ThemeProvider } from "@mui/material/styles"
import Link from "next/link"
import { theme as baseTheme, theme } from './ui/themes/baseTheme'

export default function Footer () {
  return (
    <ThemeProvider theme={baseTheme}>
      <Box display={'flex'} justifyContent={'center'} sx={{
        backgroundColor: baseTheme.palette.primary.light,
        bottom: 0,
        padding: '1rem',
        overflow: 'visible',
      }}>
        <Typography color='secondary'>
          &copy; {new Date().getUTCFullYear()} &nbsp;
          <Link 
          style={{ color: theme.palette.secondary.main, textDecoration: 'none' }}
          href={'mailto:aaronbguerrero@gmail.com?subject=Struggle Planner Inquiry'} 
          target='_blank'>
            Aaron Guerrero
          </Link>  
        </Typography>
      </Box>
    </ThemeProvider>
  )
}