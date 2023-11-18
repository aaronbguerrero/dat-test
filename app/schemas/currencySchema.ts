import { z } from 'zod'
import Dinero from 'dinero.js'
import removeCurrencyFormat from '../lib/removeCurrencyFormat'

export default function currencySchema (currency: Dinero.Currency, forceSign?: 'negative' | 'positive') {
  const currencySchema = z.string().transform(
    (value) => {
      let rawValue = removeCurrencyFormat(value)

      if (forceSign) {
        if (forceSign === 'negative') rawValue = -Math.abs(rawValue)
        else rawValue = Math.abs(rawValue)
      }

      if (value.includes('.')) {
        if (value.endsWith('.', value.length - 3)) return value.slice(0,-1)

        else if (value.endsWith('.')) {
          return Dinero({ amount: rawValue * 100, currency: currency}).toFormat('$0,0') + '.'
        }

        else if (value.endsWith('.', value.length - 1)) {
          return Dinero({ amount: rawValue, currency: currency}).toFormat('$0,0.00').slice(0,-1)
        }
  
        else return Dinero({ amount: rawValue, currency: currency}).toFormat('$0,0.00')
      }
      else {
        let newValue: number
        if (rawValue > -100 && rawValue < 100) newValue = rawValue * 100
        else newValue = rawValue
  
        return Dinero({ amount: newValue, currency: currency}).toFormat('$0,0')
      }
    }
  )

  return currencySchema
}