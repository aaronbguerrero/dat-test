import { useState, useEffect } from "react"
import useSWR from 'swr'
import { Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler } from "chart.js"
import annotationPlugin from 'chartjs-plugin-annotation'
import generateDailyCashPosition from "../../lib/generateDailyCashPosition"
import GraphData from "./graphData"
import ChartOptions from "./chartOptions"
import BasicToast, { useToast } from "../ui/toasts/basicToast"

import type { MonthData } from "../../api/months/getMonthData/[slug]/route"
import setupChartTooltips from "../../lib/setupChartTooltips"
import { Transaction } from "../../api/transactions/getTransactions/[slug]/route"
import { Box, Paper } from "@mui/material"
import { useSession } from "next-auth/react"

export default function Graph ({ month }: { month: string }) {
  const { data: session } = useSession()
  
  const toast = useToast()

  //Get user data (both month and transactions)
  const { data: transactionData, error: transactionError } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
  const { data: monthData, error: monthError } = useSWR<MonthData>(`/api/months/getMonthData/${month}`)
  if (transactionError || monthError) toast.open("Sorry! There was a problem loading some of the data. Please refresh the page.", 'error')
  
  //Setup Chart.JS
  ChartJS.register(annotationPlugin, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler)
  setupChartTooltips(transactionData, month)

  const [dailyCashPosition, setDailyCashPosition] = useState<number[]>([])
  useEffect(() => {
    if (transactionData && monthData) {
      const dailyCashArray = generateDailyCashPosition(transactionData, monthData)
      setDailyCashPosition(dailyCashArray)
    }
    }, [transactionData, monthData])
  
  return (
    <>
      <Paper sx={{ minHeight: '15rem', height: '100%', width: '100%', position: 'relative', }}>
          <Line 
        data={GraphData(dailyCashPosition)}  
        options={ChartOptions(month, session?.user?.currencyUsed || 'USD')}
        />
      </Paper>

      <BasicToast {...toast} />
    </>
  )
}