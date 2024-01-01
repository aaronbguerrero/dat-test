import React, { useEffect, useRef, useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import FullCalendar from "@fullcalendar/react"
import daygrid from "@fullcalendar/daygrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import { EventClickArg, EventInput, EventChangeArg, EventContentArg, CalendarApi } from "@fullcalendar/core"
import { useTheme } from "@mui/material/styles"
import { Box, Paper, Typography } from "@mui/material"
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
      calendarApi?.gotoDate(month)
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
      event.event._def.extendedProps.recurrenceParentId && 
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
    
    await fetch(`/api/transactions/updateTransaction/${id}/date/${newDate}/`)
    .then(response => response.json())
    .then(response => {
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
        editType: editType,
        transaction: transaction,
        originalDate: originalDate,
        property: property,
        newDate: newDate,
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

  //TODO: Render recurring events on top of each day

  // Event content and tooltips
  // TODO: fix flushSync error
  //Only happens when non-standard html is passed in
  const renderEventContent = (event: EventContentArg) => {
    return (
      { html: `<div>${event.event._def.title}</div>`}
      // <Tooltip arrow placement='top'
      // title={
      //   <Box>
      //     <Typography variant='subtitle2'>{event.event._def.title}</Typography>

      //     <Typography variant='caption'>{event.event._def.extendedProps.amount.toFormat()}</Typography>
      //   </Box>
      // }>

      //   <Box sx={{ paddingX: '0.25rem' }}>
      //     <Typography variant='caption'>{event.event._def.title}</Typography>
      //   </Box>
      // </Tooltip>
      
    )
  }
  
  const recurEditDialog = useRecurEditDialog(updateRecurringEventDate, handleCancelUpdateRecurringEvent)
  
  //Mutate Transactions to FullCalendar events
  useEffect(() => {
    if (transactions) {
      const newEvents: EventInput[] = []
      
      transactions.forEach((transaction: Transaction) => {
        if (transaction.amount.amount ===  null || transaction.amount.currency === null) return

        //Create FullCalendar event
        const event: EventInput = {
          title: transaction.title,
          date: transaction.date,
          allDay: true,
        }

        event.id = transaction._id.toString()

        //TODO: change event color to account color?
        if (transaction.amount.amount > 0) event.color = theme.palette.primary.main
        else event.color = theme.palette.tertiary.main

        event.extendedProps = { 
          //TODO: Stop from crashing if amount is wrong in DB (in API?)
          amount: Dinero({ 
            amount: transaction.amount.amount, 
            currency: transaction.amount.currency 
          }),
          ...transaction.isRecurring && { 
            isRecurring: transaction.isRecurring 
          },
          ...transaction.recurrenceParentId && { 
            recurrenceParentId: transaction.recurrenceParentId, 
            recurrenceFreq: transaction.recurrenceFreq 
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