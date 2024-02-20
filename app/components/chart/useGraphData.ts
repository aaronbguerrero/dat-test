import { useEffect, useState } from "react"
import { useTheme } from "@mui/material/styles"

import useSWR from "swr"
import BasicToast, { useToast } from "../ui/toasts/basicToast"
import generateDailyCashPosition from "../../lib/generateDailyCashPosition"
import { MonthData } from "../../types"
import getDaysInMonth from "../../lib/dates/getDaysInMonth"

import type { Account, Transaction } from '../../types'
import type { ChartData } from "chart.js"

export default function useGraphData ( month: string, activeAccounts: string[] ): { data: ChartData<'line'>, error: boolean } {
  const theme = useTheme()

  const [error, setError] = useState(false)
  const [xAxisLabels, setXAxisLabels] = useState<number[]>([])
  const [data, setData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: [{
      data: [0],
    }]
  })

  //Get user data
  const { data: transactions, error: transactionsError } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
  const { data: monthData, error: monthError } = useSWR<MonthData>(`/api/months/getMonthData/${month}`)
  const { data: accounts, error: accountsError } = useSWR<Account[]>(`/api/accounts/getAccounts`)

  //Check for errors and return error if one occurs
  useEffect(() => {
    if (accountsError || monthError || transactionsError) setError(true)
    else setError(false)
  }, [accountsError, monthError, setError, transactionsError])

  //Setup date labels
  useEffect(() => {
    setXAxisLabels([...Array(getDaysInMonth(month) + 1).keys()])
  }, [month])

  //Setup graph data for each account
  useEffect(() => {
    if (accounts !== undefined && transactions !== undefined && monthData && monthData !== undefined && !error) {
      const dataToGraph: ChartData<'line'> = {
        labels: xAxisLabels,
        datasets: accounts.filter(account => activeAccounts.includes(account._id.toString()))
        .map(account => {
          return {
            label: account.title,
            borderColor: account.color,
            borderWidth: 3,
            cubicInterpolationMode: "monotone",
            fill: {
              target: 'origin',
              //TODO: Figure out fill and overall graph styling
              // above: theme.palette.primary.light,
              below: (account.type === 'checking') ? theme.palette.tertiary.dark : undefined,
            },
            normalized: true,
            pointHitRadius: 10,
            data: generateDailyCashPosition(transactions.filter(transaction => {
              return transaction.account === account._id
            }), monthData),
            pointBackgroundColor: (context: { dataIndex: any; dataset: { data: any[] } }) => {
              const index = context.dataIndex
              const amount = context.dataset.data[index]
              const lastDayAmount = context.dataset.data[index-1]
              
              if (amount > lastDayAmount) return theme.palette.primary.main
              else if (amount === lastDayAmount) return 'black'
              else return theme.palette.tertiary.light
            },
            pointRadius: (context: { dataIndex: any; dataset: { data: any[] } }) => {
              const index = context.dataIndex
              const amount = context.dataset.data[index]
              const lastDayAmount = context.dataset.data[index-1]
              
              if (amount === lastDayAmount) return 0
              else return 4
            },
            pointHoverRadius: (context: { dataIndex: any; dataset: { data: any[] } }) => {
              const index = context.dataIndex
              const amount = context.dataset.data[index]
              const lastDayAmount = context.dataset.data[index-1]
              
              if (amount === lastDayAmount) return 4
              else return 8
            }
          }
        })
          
      }

      setData(dataToGraph) 
    }
  }, [accounts, activeAccounts, error, monthData, theme.palette, transactions, xAxisLabels])

  return { data: data, error: error }
}