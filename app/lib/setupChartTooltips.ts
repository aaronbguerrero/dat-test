import { Chart } from 'chart.js'
import toPrettyDateString from './dates/toPrettyDateString'
import Dinero from 'dinero.js'

import type { Transaction } from '../api/transactions/getTransactions/[slug]/route'

export default function setupChartTooltips (transactions: Transaction[] | undefined, month: string) {
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
  
  tooltips.callbacks.footer = (date) => {
    const transactionsToRender: string[] = []
    
    if (transactions && transactions.length > 0){
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date).getUTCDate()
        if (transactionDate === parseInt(date[0].label)) transactionsToRender.push(`${transaction.title}: ${Dinero({ amount: transaction.amount.amount, currency: transaction.amount.currency }).toFormat()}`)
      })
    }

    return transactionsToRender
  }
  tooltips.displayColors = false
  tooltips.bodyAlign = 'center'
}