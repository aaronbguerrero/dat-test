import { CalendarMonthTwoTone, CircleTwoTone, NavigateBeforeTwoTone, NavigateNextTwoTone } from '@mui/icons-material'
import { Box, Button, IconButton, TextField, Tooltip } from '@mui/material'
import { useRef } from 'react'
import getCurrentMonth from '../lib/dates/getCurrentMonth'
import getNextMonth from '../lib/dates/getNextMonth'
import getPreviousMonth from '../lib/dates/getPreviousMonth'
import toBasicDateString from '../lib/dates/toBasicDateString'
import toMonthString from '../lib/dates/toMonthString'

type Props = {
  month: string,
  setMonth: ( newMonth: Date ) => void,
}

export default function MonthSelector ({ month, setMonth }: Props) {
  const monthDate = new Date(month)

  const datePickerRef = useRef<HTMLInputElement>(null)

  //Handlers
  const handleSetMonth = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      setMonth(new Date(event.target.value))
    } else {
      setMonth(getCurrentMonth())
    }
  }
  
  const incrementMonth = () => {
    setMonth(getNextMonth(monthDate))
  }

  const decrementMonth = () => {
    setMonth(getPreviousMonth(monthDate))
  }

  const setMonthToCurrent = () =>
  {
    setMonth(getCurrentMonth())
  }

  const handleDatePickerClick = () => {
    //TODO: Fix extended global type for HTMLInputElement (added showPicker)
    if (datePickerRef.current) datePickerRef.current.showPicker()
  }

  return (
    <Box display='flex' justifyContent='right'>
      <input 
      type="date" 
      id="monthSelector"
      //TODO: use toMonthString when replacing with Month Picker
      // value={toMonthString(monthDate)} 
      value={toBasicDateString(monthDate)} 
      onChange={handleSetMonth} 
      required
      style={{ visibility: 'hidden', position: 'absolute', }}
      ref={datePickerRef}
      />

      <Tooltip title="Pick specific date to go to">
        <IconButton 
        color='secondary'
        size='large'
        onClick={handleDatePickerClick}
        >
          <CalendarMonthTwoTone  />
        </IconButton>
      </Tooltip>

      <Tooltip title="Go to previous month">
        <IconButton 
        color='secondary' 
        onClick={decrementMonth} 
        >
          <NavigateBeforeTwoTone fontSize='large' />
        </IconButton>
      </Tooltip>

      <Tooltip title="Go to current month">
        <IconButton 
        color='secondary' 
        onClick={setMonthToCurrent} 
        size='large'
        >
          <CircleTwoTone />
        </IconButton>
      </Tooltip>

      <Tooltip title="Go to next month">
        <IconButton 
        color='secondary' 
        onClick={incrementMonth} 
        >
          <NavigateNextTwoTone fontSize='large' />
        </IconButton>
      </Tooltip>
    </Box>
  )
}