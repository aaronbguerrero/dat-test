'use client'

import { ThemeProvider } from '@mui/material/styles'
import { theme } from './components/ui/themes/baseTheme'
import { SentimentVeryDissatisfiedTwoTone } from '@mui/icons-material'
import { CardContent, CardHeader, Typography } from '@mui/material'
import PageCard from './components/ui/pageCard'
import { Box } from '@mui/system'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  return (
    <ThemeProvider theme={theme}>
      <PageCard>
        <CardHeader 
        title="Sorry! A fatal error occured. Please reload the page." 
        titleTypographyProps={{ textAlign: "center" }}
        />  

        <CardContent>
          <Box display='flex' width='100%' justifyContent='center'>
            <SentimentVeryDissatisfiedTwoTone color='error' style={{ fontSize: '5rem'}} />
          </Box>
        </CardContent>
      </PageCard>
    </ThemeProvider>
  )
}
