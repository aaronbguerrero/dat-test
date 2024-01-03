import React, { useEffect, useRef, useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import FullCalendar from "@fullcalendar/react"
import daygrid from "@fullcalendar/daygrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import { EventClickArg, EventInput, EventChangeArg, EventContentArg, CalendarApi } from "@fullcalendar/core"
import { useTheme } from "@mui/material/styles"
import { Box, Paper, Tooltip, Typography } from "@mui/material"
import Dinero from 'dinero.js'
import RecurEditDialog, { useRecurEditDialog } from "./ui/dialogs/recurEditDialog"
import BasicToast, { useToast } from "./ui/toasts/basicToast"
import MonthSelector from "./monthSelector"
import toPrettyMonthString from "../lib/dates/toPrettyMonthString"
import toBasicDateString from "../lib/dates/toBasicDateString"
import AddTransactionDialog, { useAddTransactionDialog } from "./ui/dialogs/addTransactionDialog"
import EditTransactionDialog, { useEditTransactionDialog } from "./ui/dialogs/editTransactionDialog"

import type { RecurrenceEditType, Transaction } from '../types'
import { ModifyResult } from "mongodb"
import isDateInMonth from "../lib/dates/isDateInMonth"

type Props = { 
  month: string, 
  setMonth: ( newMonth: Date ) => void 
}

export default function Calendar ({ month, setMonth }: Props) {
  const theme = useTheme()

  const toast = useToast()
  
  //Get Transactions
  const { data: transactions } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
  
  //Get SWR mutate hook
  const { mutate } = useSWRConfig()

  //Setup dialogs
  const addTransactionDialog = useAddTransactionDialog(mutate)
  const editTransactionDialog = useEditTransactionDialog(mutate, transactions)
  
  //Change calendar month based on input state
  const calendarRef = useRef<FullCalendar>(null)
  const [calendarApi, setCalendarApi] = useState<CalendarApi>()
  useEffect(() => {
    if (calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi())

      //queueMicrotask is a workaround for FullCalendar throwing an error when changing date and rendering tooltips
      queueMicrotask(() => {
        calendarApi?.gotoDate(month)
      })
    }
  }, [calendarApi, month])
  
  const [events, setEvents] = useState<EventInput[]>([])
  const [eventToRevert, setEventToRevert] = useState<EventChangeArg>()
   
  //Click event handlers
  const handleDateClick = (clickedDate: DateClickArg) => {
    const date = clickedDate.date
    
    addTransactionDialog.open(date)
  }
  
  const handleEventClick = (event: EventClickArg) => {
    editTransactionDialog.open(
      transactions?.find(transaction => transaction._id.toString() === event.event._def.publicId)
    )
  }
  
  const handleEventDateChange = (event: EventChangeArg) => {
    setEventToRevert(event)

    if (
      event.event._def.extendedProps.recurrenceFreq && 
      event?.event?._instance?.range.start && 
      event?.oldEvent?._instance?.range.start
    ) {
      recurEditDialog.open(
        transactions?.find(
          transaction => transaction._id.toString() === event.event.id
        ),
        toBasicDateString(event.event._instance.range.start),
        'date',
        toBasicDateString(event.oldEvent._instance.range.start),
      )
    }
    else updateEventDate(event)
  }
  
  const updateEventDate = async (event: EventChangeArg) => {
    const id = event.event._def.publicId
    const newDate = event.event._instance?.range.start.toISOString()
    
    await fetch(`/api/transactions/updateTransaction/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: id,
        property: 'date',
        value: newDate,
      })
    })
    .then(response => response.json())
    .then(response => {
      console.log(response)
      if (response.ok === 1) {
        mutate(`/api/transactions/getTransactions/${month}`)
        //TODO: Update month ending amount (should rethink this piece)
        
        toast.open("Transaction(s) updated successfully!", 'success')
      }
      else {
        mutate(`/api/transactions/getTransactions/${month}`)

        eventToRevert?.revert()
        setEventToRevert(undefined)
        
        toast.open('Sorry! There was a problem updating the transaction(s). Please try again.', 'error')
      }
    })
  }

  const updateRecurringEventDate = async (
    editType: RecurrenceEditType, 
    newDate?: string, 
    property?: string, 
    transaction?: Transaction, 
    originalDate?: string,
  ) => {
    const response: Promise<ModifyResult<Transaction>> = await fetch(`/api/transactions/updateRecurringTransaction/`, { 
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        _id: transaction?._id,
        ...!transaction?.isParent && { parentId: transaction?.parentId },
        editType: editType,
        date: transaction?.date,
        property: property,
        value: newDate,
      })
    })
    .then(response => response.json())
    .then(response => {
      if (response) {
        //TODO: Need to implement error on response
        mutate(`/api/transactions/getTransactions/${month}`)
        
        toast.open("Transaction(s) updated successfully!", 'success')
      }

      else {
        eventToRevert?.revert()
        setEventToRevert(undefined)

        mutate(`/api/transactions/getTransactions/${month}`)
        
        toast.open('Sorry! There was a problem updating the transaction(s). Please try again.', 'error')
      }

      return response
    })

    return response
  }

  const handleCancelUpdateRecurringEvent = () => {
    eventToRevert?.revert()
    setEventToRevert(undefined)
  }
  
  // Event content and tooltips
  const renderEventContent = (event: EventContentArg) => {
    //TODO: Render recurring events on top of each day

    return (
      <Tooltip arrow placement='top'
      title={
        <Box>
          <Typography variant='subtitle2'>{event.event._def.title}</Typography>

          <Typography variant='caption'>{event.event._def.extendedProps.amount.toFormat()}</Typography>
        </Box>
      }>

        <Box sx={{ paddingX: '0.25rem' }}>
          <Typography variant='caption'>{event.event._def.title}</Typography>
        </Box>
      </Tooltip>
    )
  }
  
  const recurEditDialog = useRecurEditDialog(updateRecurringEventDate, handleCancelUpdateRecurringEvent)
  
  //Mutate Transactions to FullCalendar events
  useEffect(() => {
    if (transactions) {
      const newEvents: EventInput[] = []
      
      transactions.forEach((transaction: Transaction) => {
        if (
          //Check for accidental null amounts
          transaction.amount.amount ===  null || 
          transaction.amount.currency === null //||
          // //Ensure only transactions in the current month are displayed
          // !isDateInMonth(transaction.date, month)
          ) {
            return //TODO: Better error here (toast?)
          }

        //Create FullCalendar event
        const event: EventInput = {
          title: transaction.title,
          date: transaction.date,
          allDay: true,
        }

        event.id = transaction._id.toString()

        if (transaction.amount.amount > 0) event.color = theme.palette.primary.main
        else event.color = theme.palette.tertiary.main

        event.extendedProps = { 
          //TODO: Stop from crashing if amount is wrong in DB (in API?)
          amount: Dinero({ 
            amount: transaction.amount.amount, 
            currency: transaction.amount.currency 
          }),
          ...transaction.recurrenceFreq && { 
            recurrenceFreq: transaction.recurrenceFreq, 
          },
        }

        //Add event to array
        newEvents.push(event)
      })
      
      //Push events to calendar
      setEvents(newEvents)
    }
  }, [transactions, theme])
  
  return (
    <Paper sx={{ height: '100%' }}>
      <Box 
      display='flex' 
      justifyContent='space-between' 
      alignItems='center' 
      padding='1rem'
      gap={{ xs: 2, lg: 0 }}
      >
        <Typography 
        color='secondary' 
        variant='h5'
        >
          {calendarApi && toPrettyMonthString(calendarApi?.getDate())}
        </Typography>

        <MonthSelector month={month} setMonth={setMonth} />
      </Box>

      <FullCalendar 
      dateClick={handleDateClick}
      events={events}
      eventChange={handleEventDateChange}
      eventClick={handleEventClick}
      eventContent={renderEventContent}
      //Have to close toast when drag starts to make sure drop callback is fired
      eventDragStart={() => toast.close()}
      eventOrder='title'
      eventStartEditable={true}
      headerToolbar={false}
      initialView='dayGridMonth' 
      now={() => {
        const rawDate = new Date()
        return new Date(Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate(), 0))
      }}
      plugins={[ daygrid, interactionPlugin ]} 
      ref={calendarRef}
      showNonCurrentDates={true}
      timeZone='UTC'
      />

      <AddTransactionDialog {...addTransactionDialog} />
      <EditTransactionDialog {...editTransactionDialog} />
      <RecurEditDialog {...recurEditDialog} />
      <BasicToast {...toast} />
    </Paper>
  )
}