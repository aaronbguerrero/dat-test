import React, { useEffect, useRef, useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import FullCalendar from "@fullcalendar/react"
import daygrid from "@fullcalendar/daygrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import { EventClickArg, EventInput, EventChangeArg, EventContentArg, CalendarApi } from "@fullcalendar/core"
import { useTheme } from "@mui/material/styles"
import { Box, CircularProgress, Paper, Skeleton, Tooltip, Typography } from "@mui/material"
import Dinero from 'dinero.js'
import RecurEditDialog, { useRecurEditDialog } from "./ui/dialogs/recurEditDialog"
import BasicToast, { useToast } from "./ui/toasts/basicToast"
import MonthSelector from "./monthSelector"
import toPrettyMonthString from "../lib/dates/toPrettyMonthString"
import toBasicDateString from "../lib/dates/toBasicDateString"
import AddTransactionDialog, { useAddTransactionDialog } from "./ui/dialogs/addTransactionDialog"
import EditTransactionDialog, { useEditTransactionDialog } from "./ui/dialogs/editTransactionDialog"

import type { Account, RecurrenceEditType, Transaction } from '../types'
import { ModifyResult } from "mongodb"
import isDateInMonth from "../lib/dates/isDateInMonth"
import { PaidTwoTone } from "@mui/icons-material"
import getDaysInMonth from "../lib/dates/getDaysInMonth"
import setMonthData from "../lib/setMonthData"

type Props = { 
  month: string, 
  setMonth: ( newMonth: Date ) => void 
}

export default function Calendar ({ month, setMonth }: Props) {
  const theme = useTheme()

  const toast = useToast()

  const [isCalendarLoading, setIsCalendarLoading] = useState(true)
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true)
  
  //Get Transactions
  const { data: transactions } = useSWR<Transaction[]>(`/api/transactions/getTransactions/${month}`)
  
  //Get Account data
  const { data: accounts } = useSWR<Account[]>(`/api/accounts/getAccounts`)
  //TODO: Errors here for both

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

  //Setup events state with blank events as initial data
  const daysArray = new Array(getDaysInMonth(month)).fill({})
  const loadingSkeletons = daysArray.map((event, day) => {
    const newEvent: EventInput = {
        title: '',
        date: new Date(month).setUTCDate(day + 1),
        allDay: true,
        id: day.toString(),
        color: 'rgba(0,0,0,0)',
        extendedProps: {
          isLoading: true,
        }
      }
      return newEvent
    })
  const [events, setEvents] = useState<EventInput[]>(loadingSkeletons)
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
      if (response.ok === 1) {
        mutate(`/api/transactions/getTransactions/${month}`)
      
        setMonthData(month || "")
        
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
        parentId: transaction?.parentId,
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

  //TODO: Render recurring events on top of each day
  //TODO: Add icon on title for recurring events and income

  // Event content and tooltips
  const renderEventContent = (event: EventContentArg) => {
    if (event.event._def.extendedProps.isLoading) return (
        <Skeleton 
        animation='wave'
        height="1.5rem"
        />
    )
    //TODO: Render recurring events on top of each day

    return (
      // { html: `<div>${event.event._def.title}</div>`}
    
      <Tooltip arrow placement='top'
      title={
        <Box>
          <Typography variant='subtitle2'>{event.event._def.title}</Typography>

          <Typography variant='caption'>{event.event._def.extendedProps.amount.toFormat()}</Typography>
        </Box>
      }>

        <Box paddingX={0.5} gap={0.5} display='flex'>
          {/* {(event.event._def.extendedProps.amount.getAmount() >== 0) &&
          <PaidTwoTone color='primary' fontSize='small' />} */}


          <Typography variant='caption'>
            {event.event._def.title}
          </Typography>
        </Box>
      </Tooltip>
    )
  }
  
  const recurEditDialog = useRecurEditDialog(updateRecurringEventDate, handleCancelUpdateRecurringEvent)
  
  //Mutate Transactions to FullCalendar events
  useEffect(() => {
    if (transactions) {
      setIsTransactionsLoading(false)

      const newEvents: EventInput[] = []
      
      transactions.forEach((transaction: Transaction) => {
        //Check for accidental null amounts
        if (transaction.amount.amount ===  null || transaction.amount.currency === null) return 
        //TODO: Better error here (toast?)

        //Create FullCalendar event
        const event: EventInput = {
          title: transaction.title,
          date: transaction.date,
          allDay: true,
        }

        event.id = transaction._id.toString()

        event.color = accounts?.find(account => account._id === transaction.account)?.color

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

    else setIsTransactionsLoading(true)
  }, [accounts, transactions, theme])
  
  return (
    <Paper sx={{ height: '100%' }}>

      {
        isCalendarLoading && 
        
        <Box 
        display='flex' 
        alignItems='center' 
        justifyContent='center' 
        height='100%'
        >
          <CircularProgress 
          size={'10%'} 
          color='info' 
          thickness={2}
          />
        </Box>
      }

      {
        !isCalendarLoading &&

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
      }
      

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
      loading={(isLoading: boolean) => setIsCalendarLoading(isLoading)}
      />

      <AddTransactionDialog {...addTransactionDialog} />
      <EditTransactionDialog {...editTransactionDialog} />
      <RecurEditDialog {...recurEditDialog} />
      <BasicToast {...toast} />
    </Paper>
  )
}