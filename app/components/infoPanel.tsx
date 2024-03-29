'use client'

import { CreditCardTwoTone } from "@mui/icons-material"
import { Box, Divider, Paper, Tab, Table, TableBody, TableCell, TableRow, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import Dinero, { Currency } from "dinero.js"
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { z } from 'zod'

import type { MonthData } from "../types"
import getCurrentMonth from "../lib/dates/getCurrentMonth"
import toMonthString from "../lib/dates/toMonthString"
import removeCurrencyFormat from "../lib/removeCurrencyFormat"
import setMonthData from "../lib/setMonthData"
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

  const [isFuture, setIsFuture] = useState(false)
  useEffect(() => {
    const currentMonth = getCurrentMonth()
    const isFuture = month > currentMonth
    setIsFuture(isFuture)
  }, [month])
  //TODO: Is future add last few days of month
  
  //Get month data
  const { data: monthData, error: monthDataError } = useSWR<MonthData>(`/api/months/getMonthData/${toMonthString(month)}`)
  const { data: lastMonthEndingAmount, error: lastMonthEndingAmountError } = useSWR<number>(`/api/months/getLastMonthEndingAmount/${toMonthString(month)}`)
  
  useEffect(() => {
    if (monthDataError || lastMonthEndingAmountError) {
      toast.open("Sorry! There was a problem loading the month data. Please refresh the page.", 'error')
    }
    else toast.close()
  }, [monthDataError, lastMonthEndingAmountError, toast])
  
  const handleStartingAmountSubmit = async (newValue: string): Promise<boolean> => {
    if (!monthData) {
      toast.open("Sorry! There was a problem updating the starting amount. Please try again!", 'error')
      
      return false
    }

    const response = await fetch(`/api/months/updateMonthData/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application:json',
      },
      body: JSON.stringify({
        _id: monthData._id,
        property: 'startingAmount',
        value: removeCurrencyFormat(newValue),
        currency: currencyUsed,
      }),
    })
    .then(response => response.json())
    .then(async response => {
      if (response === true) {
        const response = await fetch(`/api/months/updateMonthData/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application:json',
          },
          body: JSON.stringify({
            _id: monthData._id,
            property: 'userSetStartingAmount',
            value: true,
          }),
        })
        .then(response => response.json())
        .then(response => {
          if (response === true) {
            setMonthData(monthData.month || "")
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

  const handleAccountsChange = (test: string[]) => {
  }

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
      <Table size='small'>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2} align='center'>
              {/* TODO: Add icon if not user set  */}
              <EditableInputField 
              label={`${(isFuture || !monthData?.userSetStartingAmount) ? 'Predicted' : ''} Starting Amount`}
              id='startingAmount'
              value={
                isFuture ? 
                Dinero({ amount: lastMonthEndingAmount || 0, currency: currencyUsed }).toFormat() 
                : 
                Dinero({ amount: monthData?.startingAmount.amount || 0, currency: currencyUsed }).toFormat()
              } 
              onSubmit={handleStartingAmountSubmit}
              editable={isFuture ? false : true}
              schema={schema}
              />
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Today&apos;s Balance</TableCell>
            <TableCell align="right">
              {Dinero({ 
                amount: removeCurrencyFormat(monthData?.dailyBalance[new Date().getUTCDate()]?.amount?.toString() || ''), 
                currency: currencyUsed }).toFormat()
              }
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Total Income</TableCell>
            <TableCell align="right">
              {Dinero({ 
                amount: removeCurrencyFormat(monthData?.totalIncome.amount.toString() || ''), 
                currency: currencyUsed }).toFormat()
              }
            </TableCell>
          </TableRow>
          <TableRow>

            <TableCell>Total Expenses</TableCell>
            <TableCell align="right">
              {Dinero({ 
                amount: removeCurrencyFormat(monthData?.totalExpenses.amount.toString() || ''), 
                currency: currencyUsed }).toFormat()
              }
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Balance at End of Month</TableCell>
            <TableCell align="right">
              {Dinero({ 
                amount: removeCurrencyFormat(monthData?.endingAmount.amount.toString() || ''), 
                currency: currencyUsed }).toFormat()
              }
            </TableCell>
          </TableRow>

<TableRow>
<TableCell colSpan={2} align='center'>

          <Divider color='red' /> 
</TableCell>
</TableRow>

          <TableRow>
            <TableCell>Needed on First Day of Next Month</TableCell>
            <TableCell align="right">TBD</TableCell>
          </TableRow>

          <TableRow>
            <TableCell>You&apos;ve spent this much on credit cards this month</TableCell>
            <TableCell align="right">TBD</TableCell>
          </TableRow>

          <TableRow>
            {/* TODO: Remove "forecasted" in the past */}
            <TableCell>You&apos;re forcasted to pay this much back to credit cards this month</TableCell>
            <TableCell align="right">TBD</TableCell>
          </TableRow>

          <TableRow>
            {/* TODO: Remove "forecasted" in the past */}
            <TableCell>Total added/removed from debt</TableCell>
            <TableCell align="right">TBD</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* <Typography variant='subtitle2'>{`End of Month Cash:`}</Typography>
      <Typography variant='h6'>{Dinero({ amount: removeCurrencyFormat(endingAmount), currency: currencyUsed }).toFormat()}</Typography>
      
      <Typography variant='subtitle2'>Today's Balance: </Typography>
      
      <Typography variant='subtitle2'>Needed next month: </Typography>
      
      <Typography variant='subtitle2'>This month you're predicting to pay: $XXX towards credit card debt.</Typography>
      <Typography variant='subtitle2'>This month you're forecasted to spend: $XXX on credit cards.</Typography>
    <Typography variant='subtitle2'>Total Added/Paid on Credit Cards:</Typography> */}


      <BasicToast {...toast} />
    </Paper>
  )
}