import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler, ChartData } from "chart.js"
import annotationPlugin from 'chartjs-plugin-annotation'
import useGraphData from "./useGraphData"
import ChartOptions from "./chartOptions"
import BasicToast, { useToast } from "../ui/toasts/basicToast"

import setupChartTooltips from "../../lib/setupChartTooltips"
import { Box, Paper } from "@mui/material"
import { useSession } from "next-auth/react"
import React, { useState } from 'react'
import AccountsButtons from '../ui/buttons/accountsButtons'

export default function Chart ({ month }: { month: string }) {
  const { data: session } = useSession()
  
  const toast = useToast()

  //Setup Chart.JS
  ChartJS.register(annotationPlugin, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler)
  setupChartTooltips(month)
  
  //Setup active accounts control
  const [activeAccounts, setActiveAccounts] = useState<string[]>([]) 
  const handleAccountsChange = (newAccounts: string[]) => {
    setActiveAccounts(newAccounts)
  }
  
  //Setup graph data
  const { data: graphData, error: graphError } = useGraphData(month, activeAccounts)
  if (graphError) toast.open("Sorry! There was a problem loading some of the graph data. Please refresh the page.", 'error')
  
  return (
    <Paper sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', }}>
      <AccountsButtons onChange={handleAccountsChange} orientation='vertical' />

      <Box sx={{ minHeight: '15rem', height: '99%', width: '99%', position: 'relative', overflow: 'hidden' }}>
        <Line 
        data={graphData}  
        options={ChartOptions(month, session?.user?.currencyUsed || 'USD')}
        />
      </Box>

      <BasicToast {...toast} />
    </Paper>
      
  )
}