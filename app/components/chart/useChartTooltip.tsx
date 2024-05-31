
import { Box } from '@mui/system'
import Dinero from 'dinero.js'
import useSWR from 'swr'
import toPrettyDateString from '../../lib/dates/toPrettyDateString'

import type { Transaction } from '../../types'
import type { TooltipProps } from 'recharts'

export default function useChartTooltips (month: string) {
  const { data: transactions, error: transactionsError } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
//TODO: handle error

  const tooltipsContent = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && transactions) {
      let date = 'Starting Amount' 
      if (label !== 0) { 
        const fullDate = new Date(`${month}-${label}`)
        date = toPrettyDateString(fullDate)
      }

      const transactionsToRender: string[] = []
      
      if (transactions && transactions.length > 0){
        transactions.forEach(transaction => {
          const transactionDate = new Date(transaction.date).getUTCDate()
          if (transactionDate === label) {
            //TODO: Icon and color for account
            transactionsToRender.push(`${transaction.title}: ${Dinero({ amount: transaction.amount.amount, currency: transaction.amount.currency }).toFormat()}`)
          }
        })
      }

      return (
        <Box border="solid blue 1px" sx={{ backgroundColor: 'red', padding: '1rem'}}>
          <h4>{date}</h4>
          <h5>
            {
              Dinero({ 
              amount: payload ? payload[0].value: 0, 
              currency: transactions[0].amount.currency 
              })
              .toFormat()
            }
            </h5>
          <ul>
            {transactionsToRender.map((transaction, index) => {
              return (
                <li key={index}>{transaction}</li>
              )
            })}
          </ul>

        </Box>
      )
    }

    return null
  }
    
  return { tooltipsContent }
}