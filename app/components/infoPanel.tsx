'use client'

import { Paper, Typography } from "@mui/material"
import Dinero, { Currency } from "dinero.js"
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { z } from 'zod'

import type { MonthData } from "../api/months/getMonthData/[slug]/route"
import getCurrentMonth from "../lib/dates/getCurrentMonth"
import toMonthString from "../lib/dates/toMonthString"
import removeCurrencyFormat from "../lib/removeCurrencyFormat"
import updateMonthEndingAmount from "../lib/updateMonthEndingAmount"
import currencySchema from "../schemas/currencySchema"
import EditableInputField from "./ui/formElements/editableInputField"
import BasicToast, { useToast } from "./ui/toasts/basicToast"

type Props = {
  month: Date,
}

export default function InfoPanel ({ month }: Props) {
  const toast = useToast()

  //Get user's currency, set USD as default
  const { data: session } = useSession()
  const [currencyUsed, setCurrencyUsed] = useState<Currency>('USD')
  useEffect(() => {
    if (session?.user?.currencyUsed) {
      setCurrencyUsed(session?.user?.currencyUsed)
    }
  }, [session])

  const { mutate } = useSWRConfig()

  const currentMonth = getCurrentMonth()
  const isFuture = month > currentMonth
  //TODO: Is future add last few days of month
  
  //Get month data
  const { data: monthData, error: monthDataError } = useSWR<MonthData>(`/api/months/getMonthData/${toMonthString(month)}`)
  const { data: lastMonthEndingAmountData, error: lastMonthEndingAmountError } = useSWR<number>(`/api/months/getLastMonthEndingAmount/${toMonthString(month)}`)
  if (monthDataError || lastMonthEndingAmountError) toast.open("Sorry! There was a problem loading the month data. Please refresh the page.", 'error')

  //Calculate and set values
  const [endingAmount, setEndingAmount] = useState('')

  useEffect(() => {
    if (monthData) {
      setEndingAmount(monthData.endingAmount.amount.toString())
    }
  },[monthData])
  
  const [lastMonthEndingAmount, setLastMonthEndingAmount] = useState('')

  useEffect(() => {
    if (lastMonthEndingAmountData) {
      setLastMonthEndingAmount(lastMonthEndingAmountData.toString())
    }
  },[lastMonthEndingAmountData, currencyUsed])

  const handleStartingAmountSubmit = async (newValue: string): Promise<boolean> => {
    if (!monthData) {
      toast.open("Sorry! There was a problem updating the starting amount. Please try again!", 'error')
      
      return false
    }

    const response = await fetch(`/api/months/updateMonthData/${monthData._id}/startingAmount/${removeCurrencyFormat(newValue)}/${currencyUsed}`)
    .then(response => response.json())
    .then(async response => {
      if (response === true) {
        const response = await fetch(`/api/months/updateMonthData/${monthData._id}/userSetStartingAmount/true`)
        .then(response => response.json())
        .then(response => {
          if (response === true) {
            updateMonthEndingAmount(monthData.month || "")
            .then(response => {
              if (response === true) toast.open("Starting amount updated successfully!", 'success')
              else toast.open("Sorry! There was a problem updating the ending amount. Please refresh the page.", 'error')
            })
            
            mutate(`/api/months/getMonthData/${toMonthString(month)}`)
            return true
          }
          else {
            toast.open("Sorry! There was a problem updating the starting amount. Please try again!", 'error')
            return false
          }
        })

        return response
      }
      
      else {
        toast.open("Sorry! There was a problem updating the starting amount. Please try again!", 'error')
        return false
      }
    })

    return response
  }

  const schema = currencySchema(currencyUsed)

  return (
    <Paper 
    sx={{ 
      width: '100%', 
      padding: '1rem', 
      display: 'flex', 
      flexDirection: { xs: 'row', lg: 'column' }, 
      alignItems: 'center',
      gap: '0.5rem',
    }}>

      {/* TODO: Add icon if not user set  */}
      <EditableInputField 
      label={`${(isFuture || !monthData?.userSetStartingAmount) ? 'Predicted' : ''} Starting Amount`}
      id='startingAmount'
      value={
        isFuture ? 
        Dinero({ amount: removeCurrencyFormat(lastMonthEndingAmount), currency: currencyUsed }).toFormat() 
        : 
        Dinero({ amount: monthData?.startingAmount.amount || 0, currency: currencyUsed }).toFormat()
      } 
      onSubmit={handleStartingAmountSubmit}
      editable={isFuture ? false : true}
      schema={schema}
      />

      {/* TODO: Cash today */}
      <Typography variant='subtitle2'>{`End of Month Cash:`}</Typography>
      <Typography variant='h6'>{Dinero({ amount: removeCurrencyFormat(endingAmount), currency: currencyUsed }).toFormat()}</Typography>
      
      {/* <Typography>This month you're predicting to pay: $XXX towards credit card debt.</Typography>
      <Typography>This month you're forecasted to spend: $XXX on credit cards.</Typography>
      <Typography>Total Added/Paid on Credit Cards:</Typography> */}

      <BasicToast {...toast} />
  </Paper>
  )
}