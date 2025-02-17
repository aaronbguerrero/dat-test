import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler, ChartData } from "chart.js"
import annotationPlugin from 'chartjs-plugin-annotation'
import useGraphData from "./useGraphData"
import ChartOptions from "./chartOptions"
import BasicToast, { useToast } from "../ui/toasts/basicToast"

import useChartTooltips from "../../lib/useChartTooltips"
import { Box, CircularProgress, Paper } from "@mui/material"
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import AccountsButtons from '../ui/buttons/accountsButtons'

export default function Chart ({ month }: { month: string }) {
  const { data: session } = useSession()
  
  const toast = useToast()

  //Setup Chart.JS
  ChartJS.register(annotationPlugin, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler)
  useChartTooltips(month)
  
  //Setup active accounts control
  const [activeAccounts, setActiveAccounts] = useState<string[]>([]) 
  const handleAccountsChange = (newAccounts: string[]) => {
    setActiveAccounts(newAccounts)
  }
  
  //Setup graph data
  const { data: graphData, error: graphError, loading: graphLoading } = useGraphData(month, activeAccounts)
  useEffect(() => {
    if (graphError) toast.open("Sorry! There was a problem loading some of the graph data. Please refresh the page.", 'error')
    else if (toast.content === "Sorry! There was a problem loading some of the graph data. Please refresh the page.") toast.close()
  }, [graphError, toast])

  const chartOptions = ChartOptions(month, session?.user?.currencyUsed || 'USD')
  
  return (
    <Paper sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', }}>
      { graphLoading &&
      
        <Box width='100%' display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress 
          size={'4rem'} 
          color='info' 
          thickness={2}
          />
        </Box>
      }
      
      {/* TODO: User set if exclusive */}
      { !graphLoading &&
        <>
          <AccountsButtons onChange={handleAccountsChange} orientation='vertical' exclusive />

          <Box sx={{ minHeight: '15rem', height: '99%', width: '99%', position: 'relative', overflow: 'hidden' }}>
            <Line 
            data={graphData}  
            options={chartOptions}
            />
          </Box>
        </>
      } 

      <BasicToast {...toast} />
    </Paper>
      
  )
}