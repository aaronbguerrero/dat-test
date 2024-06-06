
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
        <Box sx={{ 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          padding: '0.5rem', 
          color: 'white',
          borderRadius: '5%',
          }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 200 }}>{date}</span>

          <br />

          <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>
            Balance:&nbsp;
            {
              Dinero({ 
              amount: payload ? payload[0].value: 0, 
              currency: transactions[0].amount.currency 
              })
              .toFormat()
            }
          </span> 

          {
            (transactionsToRender.length >= 1) &&

            <>
              <hr />

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, }}>
                {transactionsToRender.map((transaction, index) => {
                  return (
                    <li key={index}>
                      <span style={{ fontSize: '0.75rem' }}>
                        {transaction}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          }


        </Box>
      )
    }

    return null
  }
    
  return { tooltipsContent }
}