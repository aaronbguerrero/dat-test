import { Chart } from 'chart.js'
import toPrettyDateString from './dates/toPrettyDateString'
import Dinero from 'dinero.js'
import useSWR from 'swr'

import type { Transaction } from '../types'

export default function setupChartTooltips (month: string) {
  const { data: transactions, error: transactionsError } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
//TODO: handle error

  const tooltips = Chart.defaults.plugins.tooltip
  
  tooltips.callbacks.title = (date) => {
    if (date[0].label === '0') return 'Starting Amount' 

      const fullDate = new Date(`${month}-${date[0].label}`)
    
      return toPrettyDateString(fullDate)

  }

  tooltips.callbacks.label = (amount) => {
    if (transactions && transactions.length > 0 && amount) {
      return Dinero({ amount: <number>amount.raw, currency: transactions[0].amount.currency }).toFormat()
    }
  }
  //TODO: Icon and color for account
  tooltips.callbacks.footer = (date) => {
    const transactionsToRender: string[] = []
    
    if (transactions && transactions.length > 0){
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date).getUTCDate()
        if (transactionDate === parseInt(date[0].label)) {
          transactionsToRender.push(`${transaction.title}: ${Dinero({ amount: transaction.amount.amount, currency: transaction.amount.currency }).toFormat()}`)
        }
      })
    }

    return transactionsToRender
  }
  tooltips.displayColors = false
  tooltips.bodyAlign = 'center'
}