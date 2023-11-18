'use client'

import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../components/ui/themes/baseTheme'
import PageCard from '../components/ui/pageCard'
import { CardContent, CardHeader, Paper, Typography } from "@mui/material"
import { Box } from '@mui/system'
import { MarkEmailUnreadTwoTone } from '@mui/icons-material'

export default function Verify () {
  return (
    <ThemeProvider theme={theme}>
      <PageCard>
        <CardHeader 
        title="Check your email!" 
        titleTypographyProps={{ textAlign: "center" }}
        />  

        <CardContent>
          <Box display='flex' width='100%' alignItems='center' gap={4} flexDirection='column'>
            <Typography>We&#39;ve sent you a link to login.</Typography>
            <MarkEmailUnreadTwoTone color='primary' style={{ fontSize: '5rem'}} />
          </Box>
        </CardContent>
      </PageCard>
    </ThemeProvider>
  )
}