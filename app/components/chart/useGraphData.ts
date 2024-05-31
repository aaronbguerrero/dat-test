import { useEffect, useState } from "react"
import { useTheme } from "@mui/material/styles"

import useSWR from "swr"
import generateDailyCashPosition from "../../lib/generateDailyCashPosition"
import { MonthData } from "../../types"
import getDaysInMonth from "../../lib/dates/getDaysInMonth"

import type { Account, Transaction } from '../../types'

export type ChartDataPoint = {
  day: number,
  [accountId: string]: number,
}

export default function useGraphData ( month: string, activeAccounts: string[] ): { 
  data: ChartDataPoint[], 
  error: boolean,
  loading: boolean,
} {
  const theme = useTheme()

  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChartDataPoint[]>([])

  //Get user data
  const { data: transactions, error: transactionsError } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
  const { data: monthData, error: monthError } = useSWR<MonthData>(`/api/months/getMonthData/${month}`)
  const { data: accounts, error: accountsError } = useSWR<Account[]>(`/api/accounts/getAccounts`)

  //Check for errors and return error if one occurs
  useEffect(() => {
    if (accountsError || monthError || transactionsError) setError(true)
    else setError(false)
  }, [accountsError, monthError, setError, transactionsError])

  //Setup graph data for each account
  // useEffect(() => {
  //   if (accounts && transactions && monthData && monthData !== undefined && !error) {
  //     const getDataset: (account: Account) => ChartDataset<'line'> = (account: Account) => {
  //       return {
  //         label: account.title,
  //         borderColor: account.color,
  //         fill: {
  //           target: 'origin',
  //           //TODO: Figure out fill and overall graph styling
  //           // above: theme.palette.primary.light,
  //           below: (account.type === 'checking') ? theme.palette.tertiary.dark : undefined,
  //         },
  //         normalized: true,
  //         pointHitRadius: 10,
  //         pointHoverRadius: (context: { dataIndex: any; dataset: { data: any[] } }) => {
  //           const index = context.dataIndex
  //           const amount = context.dataset.data[index]
  //           const lastDayAmount = context.dataset.data[index-1]
            
  //           if (amount === lastDayAmount) return 4
  //           else return 8
  //         }
  //       }
  //     }
  useEffect(() => {
    if (accounts && transactions && monthData && monthData !== undefined && !error) {    
      //Setup empty days in month
      const dataToGraph: ChartDataPoint[] = []
      for ( let i = 0; i < getDaysInMonth(month); i++) {
        const dataPoint: ChartDataPoint = { day: i }
      }
      
      //For each active account, generate the array of daily cash position
      accounts.filter(account => activeAccounts.includes(account._id.toString()))
      .forEach(account => {
        generateDailyCashPosition(
          transactions.filter(transaction => {
            return transaction.account === account._id
          }), monthData
        )
        //For each day in an accounts cash position, add that account and amount to the output array
        .forEach((dailyAmount, index) => {
          dataToGraph[index] = { ...dataToGraph[index], [account._id.toString()]: dailyAmount.getAmount() }
        })
      })
      
      setData(dataToGraph) 
      setLoading(false)
    }
  }, [accounts, activeAccounts, error, month, monthData, theme.palette, transactions])

  return { data: data, error: error, loading: loading }
}