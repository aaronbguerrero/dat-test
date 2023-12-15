'use client'

import { SWRConfig } from 'swr'
import { useEffect, useState } from 'react'
import Calendar from '../components/calendar'
import InfoPanel from '../components/infoPanel'
import Chart from '../components/chart/chart'
import toMonthString from '../lib/dates/toMonthString'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../components/ui/themes/baseTheme'
import Grid from '@mui/material/Unstable_Grid2'
import getCurrentMonth from '../lib/dates/getCurrentMonth'
import BasicToast, { useToast } from '../components/ui/toasts/basicToast'
import { useSWRConfig } from 'swr'
import setupSwrFetcher from '../lib/setupSwrFetcher'

export default function Dashboard () {
  const { mutate } = useSWRConfig()

  const toast = useToast()
  
  //TODO: Move fetcher to lib (add toast to file)
  const fetcher = setupSwrFetcher("Sorry! There was a problem loading the transaction data. Please refresh the page.", toast)

  const [month, setMonth] = useState<Date>(getCurrentMonth())
  const handleSetMonth = (newMonth: Date) => {
    setMonth(newMonth)
  }

  useEffect(() => {
    const setupMonth = async () => {
      const response = await fetch(`/api/months/setupMonthData/${toMonthString(month)}`)
      .then(response => response.json())
      
      if (response === true) {
        mutate(`/api/months/getMonthData/${toMonthString(month)}`)
      }
      
      else toast.open("Sorry! There was a problem setting up the month data. Please refresh the page.", 'error')
    }

    setupMonth()
  }, [month, mutate, toast])

  return (
    <SWRConfig value={fetcher}>
      <ThemeProvider theme={theme}>
          <Grid container spacing={2} margin={0} height='100%'>
            <Grid order={0} xs={12} lg={9}>
                <Calendar month={toMonthString(month)} setMonth={handleSetMonth} />
            </Grid>

            <Grid order={1} xs display={'flex'}>
              <InfoPanel month={month} />
            </Grid>

            <Grid order={2} xs={12}>
              <Chart month={toMonthString(month)} />
            </Grid>
          </Grid>

          <BasicToast {...toast} />
      </ThemeProvider>
    </SWRConfig>
  )
}