'use client'

import { ThemeProvider } from '@mui/material/styles'
import { theme } from './components/ui/themes/baseTheme'
import { SentimentDissatisfiedTwoTone } from '@mui/icons-material'
import { CardContent, CardHeader, Typography } from '@mui/material'
import PageCard from './components/ui/pageCard'
import { Box } from '@mui/system'
 
export default function NotFound() {
  return (
    <ThemeProvider theme={theme}>
      <PageCard>
        <CardHeader 
        title="Sorry! We couldn't find that page." 
        titleTypographyProps={{ textAlign: "center" }}
        />  

        <CardContent>
          <Box display='flex' width='100%' justifyContent='center'>
            <SentimentDissatisfiedTwoTone color='secondary' style={{ fontSize: '5rem'}} />
          </Box>
        </CardContent>
      </PageCard>
    </ThemeProvider>
    
  )
}