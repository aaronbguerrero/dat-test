import { 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Area, 
  Dot, 
  ReferenceLine 
} from 'recharts'
import useGraphData from "./useGraphData"
import BasicToast, { useToast } from "../ui/toasts/basicToast"
import Dinero from 'dinero.js'
import { Box, CircularProgress, Paper, useTheme } from "@mui/material"
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import AccountsButtons from '../ui/buttons/accountsButtons'
import toPrettyDayOfWeekString from '../../lib/dates/toPrettyDayOfWeekString'

export default function Chart ({ month }: { month: string }) {
  const errorMessage = "Sorry! There was a problem loading some of the graph data. Please refresh the page."
  const { data: session } = useSession()
  
  const toast = useToast()
  const theme = useTheme()

  //Setup and track today
  const [today, setToday] = useState(0)
  useEffect(() => {
    const todaysDate = new Date()
    const currentMonth = new Date(month).getUTCMonth()
    if (todaysDate.getUTCMonth() === currentMonth) setToday(todaysDate.getDate())
    else setToday(0)
  }, [month])
  
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

          <ResponsiveContainer minHeight={'20rem'}>
            <AreaChart 
            dataKey={JSON.stringify(graphData)} 
            data={graphData} 
            margin={{ top: 15, left: 15, right: 15, bottom: 50 }}
            > 
              <defs>
                <linearGradient id="fillColor" x1="0" y1=".5" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity={1} />
                  <stop offset="100%" stopColor="red" stopOpacity={1} />
                </linearGradient>
              </defs>
              
              <CartesianGrid stroke="#ddd" />
            
              <ReferenceLine y={0} stroke="black" />

              {activeAccounts.map(account => {
                return (
                  <Area 
                  key={account}
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

              {/* Today's reference line, hide if not in month */}
              {
                (today !== 0) &&
                <ReferenceLine 
                x={15} 
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                label={{ value: "Today", position: "top", fontSize: '0.6rem', fill: theme.palette.secondary.dark }} 
                />
              }

              <XAxis 
              tickFormatter={value => {
                if (value === 0)  return 'Starting'

                const date = new Date(month)
                date.setUTCDate(value)
                
                return toPrettyDayOfWeekString(date)
              }} 
              angle={-50}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: '.75rem' }}
              // fontSize={12}
              />

              <YAxis 
              tickFormatter={value => {
                if (session?.user?.currencyUsed) {
                  const amount = Dinero({ 
                    amount: value, 
                    currency: session.user.currencyUsed, 
                  })
                  .toFormat('$0,0')
    
                  return amount
                }

                return value
              }} 
              tick={{ fontSize: '.75rem' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      } 

      <BasicToast {...toast} />
    </Paper>
      
  )
}