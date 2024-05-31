import { LineChart, AreaChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Area, Dot } from 'recharts'
// import { Chart as ChartJS, CategoryScale, Legend, LinearScale, PointElement, LineElement, Tooltip, Filler, ChartData } from "chart.js"
import useGraphData from "./useGraphData"
import ChartOptions from "./chartOptions"
import BasicToast, { useToast } from "../ui/toasts/basicToast"

import { Box, CircularProgress, Paper, useTheme } from "@mui/material"
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import AccountsButtons from '../ui/buttons/accountsButtons'
import { url } from 'inspector'

export default function Chart ({ month }: { month: string }) {
  const errorMessage = "Sorry! There was a problem loading some of the graph data. Please refresh the page."
  const { data: session } = useSession()
  
  const toast = useToast()
  const theme = useTheme()
  
  //Setup active accounts control
  const [activeAccounts, setActiveAccounts] = useState<string[]>([]) 
  const handleAccountsChange = (newAccounts: string[]) => {
    setActiveAccounts(newAccounts)
  }
  
  //Setup graph data
  const { data: graphData, error: graphError, loading: graphLoading } = useGraphData(month, activeAccounts)
  useEffect(() => {
    if (graphError) toast.open(errorMessage, 'error')
    else if (toast.content === errorMessage) toast.close()
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

          <ResponsiveContainer minHeight={'15rem'}>
            <AreaChart dataKey={JSON.stringify(graphData)} data={graphData}>
              <defs>
                <linearGradient id="fillColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity={1} />
                  <stop offset="100%" stopColor="red" stopOpacity={1} />
                </linearGradient>
              </defs>
              
              <CartesianGrid stroke="#ddd" />

              {activeAccounts.map(account => {
                return (
                  <Area 
                  type='bump' 
                  dataKey={account} 
                  stroke="red" 
                  strokeWidth={2}
                  fill={"url(#fillColor)"}
                  dot={({ cx, cy, index }) => {
                    const amount = graphData[index][account]
                    const lastDayAmount = (index > 0) ? graphData[index-1][account] : 0

                    let color = 'black'
                    if (amount > lastDayAmount) color = theme.palette.primary.main
                    else if (amount < lastDayAmount) color = theme.palette.tertiary.light

                    return <Dot 
                    cx={cx} 
                    cy={cy} 
                    r={(amount === lastDayAmount) ? 0 : 4} 
                    stroke={'red'} 
                    fill={color} 
                    />
                  }}
                  //TODO: account color
                  />
                )
              })}

              <XAxis />
              <YAxis />
            </AreaChart>
          </ResponsiveContainer>
        </>
      } 

      <BasicToast {...toast} />
    </Paper>
      
  )
}