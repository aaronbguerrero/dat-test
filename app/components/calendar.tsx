import React, { useEffect, useRef, useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import FullCalendar from "@fullcalendar/react"
import daygrid from "@fullcalendar/daygrid"
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import { EventClickArg, EventInput, EventChangeArg, EventContentArg, CalendarApi } from "@fullcalendar/core"
import AddTransactionDialog from "./ui/dialogs/addTransactionDialog"
import EditTransactionDialog from "./ui/dialogs/editTransactionDialog"
import { useTheme } from "@mui/material/styles"
import type { Transaction } from "../api/transactions/getTransactions/[slug]/route"
import { Box, Paper, Typography } from "@mui/material"
import Dinero from 'dinero.js'
import RecurEditDialog, { useRecurEditDialog } from "./ui/dialogs/recurEditDialog"
import BasicToast, { useToast } from "./ui/toasts/basicToast"
import MonthSelector from "./monthSelector"
import toPrettyMonthString from "../lib/dates/toPrettyMonthString"
import toBasicDateString from "../lib/dates/toBasicDateString"

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

  //Dialogs and handlers
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [addDialogContent, setAddDialogContent] = useState<Date>()
  const [editDialogContent, setEditDialogContent] = useState<Transaction>()
  
  const handleSetIsAddDialogOpen = (isOpen: boolean) => {
    setIsAddDialogOpen(isOpen)
  }
  
  const handleSetIsEditDialogOpen = (isOpen: boolean) => {
    setIsEditDialogOpen(isOpen)
  }
  
  //Click event handlers
  const handleDateClick = (clickedDate: DateClickArg) => {
    const date = clickedDate.date
    
    setAddDialogContent(date)
    setIsAddDialogOpen(true)
  }
  
  const handleEventClick = (event: EventClickArg) => {
    setEditDialogContent(transactions?.find( transaction => transaction._id === event.event._def.publicId ))
    setIsEditDialogOpen(true)
  }
  
  const handleEventChange = (event: EventChangeArg) => {
    if (event.event._def.extendedProps.recurrenceParentId) {
      setRecurEditDialogEvent(event)
      recurEditDialog.open()
    }
    else updateEvent(event)
  }
  
  const updateEvent = async (event: EventChangeArg) => {
    const id = event.event._def.publicId
    const newDate = event.event._instance?.range.start.toISOString()
    
    await fetch(`/api/transactions/updateTransaction/${id}/date/${newDate}/`)
    .then(response => response.json())
    .then(response => {
      if (response === true) {
        mutate(`/api/transactions/getTransactions/${month}`)
        
        toast.open("Transaction(s) updated successfully!", 'success')
      }
      else {
        mutate(`/api/transactions/getTransactions/${month}`)
        
        toast.open('Sorry! There was a problem updating the transaction(s). Please try again.', 'error')
      }
    })
  }

  const updateRecurringEvent = async (editType: 'single' | 'future' | 'all') => {
    if (recurEditDialogEvent?.event._instance && recurEditDialogEvent?.oldEvent._instance) {
      const parentId = recurEditDialogEvent.event._def.extendedProps.recurrenceParentId
      const originalDate = toBasicDateString(recurEditDialogEvent.oldEvent._instance.range.start)
      const newDate = toBasicDateString(recurEditDialogEvent.event._instance.range.start)
      
      const response = await fetch(`/api/transactions/updateRecurringTransaction/${editType}/${parentId}/${originalDate}/date/${newDate}`)
      .then(response => response.json())
      .then(response => {
        if (response === true) {
          mutate(`/api/transactions/getTransactions/${month}`)
          
          toast.open("Transaction(s) updated successfully!", 'success')

          return true
        }

        else {
          mutate(`/api/transactions/getTransactions/${month}`)
          
          toast.open('Sorry! There was a problem updating the transaction(s). Please try again.', 'error')
          
          return false
        }
      })

      return response
    }

    return false
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
  
  const [recurEditDialogEvent, setRecurEditDialogEvent] = useState<EventChangeArg>()

  const handleCancelUpdateRecurringEvent = () => {
    recurEditDialogEvent?.revert()
  }
  
  const recurEditDialog = useRecurEditDialog(updateRecurringEvent, handleCancelUpdateRecurringEvent)
  
  //Mutate Transactions to FullCalendar events
  useEffect(() => {
    if (transactions) {
      const newEvents: EventInput[] = []
      
      transactions.forEach((transaction: Transaction) => {
        //If the transaction (or it's main child) is in the active edit dialog, replace it with the latest
        if (transaction._id === editDialogContent?._id) setEditDialogContent(transaction)
        else if (transaction.recurrenceParentId === editDialogContent?._id && transaction.date === editDialogContent?.date) {
          setEditDialogContent(transaction)
        }


        //Create FullCalendar event
        const event: EventInput = {
          title: transaction.title,
          date: transaction.date,
          allDay: true,
        }

        if (transaction._id) {
          event.id =  transaction._id.toString()
        } 

        if (transaction.amount.amount > 0) event.color = theme.palette.primary.main
        else event.color = theme.palette.tertiary.main

        event.extendedProps = { 
          //TODO: Stop from crashing if amount is wrong in DB
          amount: Dinero({ amount: transaction.amount.amount, currency: transaction.amount.currency }),
          ...transaction.isRecurring && { isRecurring: transaction.isRecurring },
          ...transaction.recurrenceParentId && { recurrenceParentId: transaction.recurrenceParentId, recurrenceFreq: transaction.recurrenceFreq },
        }

        //Add event to array
        newEvents.push(event)
      })
      
      //Push events to calendar
      setEvents(newEvents)
    }
  }, [editDialogContent?.date, editDialogContent?._id, transactions, theme])
  
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
      eventChange={handleEventChange}
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

      {addDialogContent ? 
        <AddTransactionDialog 
        isOpen={isAddDialogOpen} 
        setIsOpen={handleSetIsAddDialogOpen} 
        date={addDialogContent} 
        mutate={mutate} 
        /> 
        : 
        null
      }
      {editDialogContent ? 
        <EditTransactionDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={handleSetIsEditDialogOpen} 
        content={editDialogContent} 
        mutate={mutate} 
        /> 
        :
        null
      }

      <RecurEditDialog {...recurEditDialog} />
      <BasicToast {...toast} />
    </Paper>
  )
}