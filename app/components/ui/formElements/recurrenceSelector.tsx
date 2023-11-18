import { useWhatChanged } from '@simbathesailor/use-what-changed'
import { 
  Box, 
  FormControlLabel, 
  MenuItem, 
  Select, 
  SelectChangeEvent, 
  TextField, 
  ToggleButton, 
  ToggleButtonGroup, 
  Typography 
} from "@mui/material"
import { ChangeEvent, useEffect, useState } from "react"
import { Frequency, RRule, Weekday } from 'rrule'
import toBasicDateString from "../../../lib/dates/toBasicDateString"

type Props = { 
  value: string,
  onChange: (rule: string) => void,
  date: Date,
  disabled?: boolean,
  editButton?: React.ReactNode,
  label?: string,
  id: string,
}

//1. Take in value from outside
//2. build rule from it
//3. populate that rule into form fields
//4. if those fields change:
  //4a. construct new rule
  //4b. pass new rule to parent

export default function RecurrenceSelector ({ value, onChange, date, disabled, editButton, label, id }: Props) {
  const [internalRule, setInternalRule] = useState<RRule>(RRule.fromString(value))

  const [freq, setFreq] = useState<Frequency>(RRule.MONTHLY)
  const [interval, setInterval] = useState(1)
  const [repeatUntilMode, setRepeatUntilMode] = useState<'forever' | 'for' | 'until'>('forever')
  const [untilDate, setUntilDate] = useState('')
  const [untilCount, setUntilCount] = useState(1)
  const [daysToRepeat, setDaysToRepeat] = useState(['0', '1', '2', '3', '4', '5', '6'])

  const handleSetFreq = (event: SelectChangeEvent) => {
    switch (event.target.value) {
      case '0':
        setFreq(RRule.YEARLY)
        break
        case '1':
          setFreq(RRule.MONTHLY)
          break
          case '2':
        setFreq(RRule.WEEKLY)
        break
      case '3':
        setFreq(RRule.DAILY)
        break
    }
  }

  const handleSetInterval = (event: ChangeEvent<HTMLInputElement>) => {
    const newInterval = parseInt(event.target.value)

    if (newInterval > 0) setInterval(newInterval)
  }

  const handleSetRepeatUntilMode = (event: SelectChangeEvent) => {
    setRepeatUntilMode(event.target.value as 'forever' | 'for' | 'until')
  }

  const handleSetUntilDate = (event: ChangeEvent<HTMLInputElement>) => {
    setUntilDate(event.target.value)
  }

  const handleSetUntilCount = (event: ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(event.target.value)

    if (newCount > 0) setUntilCount(newCount)
  }

  const handleDaysToRepeatChange = (event: React.MouseEvent<HTMLElement>, newDays: string[]) => {
    setDaysToRepeat(newDays)
  }

  //Render frequency options
  const renderFreqOptions = () => {
    switch (freq) {
      case RRule.YEARLY:
        return 'on date, on the "FIRST FRIDAY OF SEPT'
      case RRule.MONTHLY:
        return null
        // return (
        //   <FormControlLabel
        //   label="Repeat on:"
        //   labelPlacement='top'
        //   control={
        //     <RadioGroup>
        //       <FormControlLabel label='A day' value='date' control={<Radio />}></FormControlLabel>
        //       <FormControlLabel label='The' value='date' control={<Radio />}></FormControlLabel>
        //       <Typography>of every month</Typography>
        //     </RadioGroup>
        //   }
        //   />
        // )
        //'day of month, on the "FIRST FRIDAY OF Month or first weekday'
        //what happens on the 31st if it's a 30 day month?
      case RRule.WEEKLY:
        return null
        //TODO: In future release: Weekday only (push any that land on weekend forward to monday)
      case RRule.DAILY:
        return (
          <FormControlLabel
          disabled={disabled}
          label="Day(s) to repeat on:"
          labelPlacement='top'
          control={
            <ToggleButtonGroup 
            disabled={disabled}
            color={disabled ? 'standard' : 'secondary'}
            size='small' 
            value={daysToRepeat} 
            onChange={handleDaysToRepeatChange}
            >
              {/* TODO: Tooltips with full day name  */}
              <ToggleButton value="6">Sun</ToggleButton>
              <ToggleButton value="0">Mon</ToggleButton>
              <ToggleButton value="1">Tue</ToggleButton>
              <ToggleButton value="2">Wed</ToggleButton>
              <ToggleButton value="3">Thu</ToggleButton>
              <ToggleButton value="4">Fri</ToggleButton>
              <ToggleButton value="5">Sat</ToggleButton>
            </ToggleButtonGroup>
          }
          />
        )
    }
  }

  //Setup values if they exist and handle changes
  useEffect(() => {
    setInternalRule(RRule.fromString(value))
  }, [value])

  useEffect(() => {
    if (!internalRule || internalRule.toString() === '') {
      setFreq(RRule.MONTHLY)
      setInterval(1)
      setRepeatUntilMode('forever')
      setUntilDate('')
      setUntilCount(1)
      setDaysToRepeat(['0', '1', '2', '3', '4', '5', '6'])

      return
    }

    const rule = internalRule.options

    setFreq(rule.freq)
    setInterval(rule.interval)

    if (rule.until) {
      const isForever = (toBasicDateString(rule.until) === '9999-12-31')

      setRepeatUntilMode(isForever ? 'forever' : 'until')
      setUntilDate(isForever ? '' : toBasicDateString(rule.until))
    }
    
    else {
      setRepeatUntilMode('for')
      setUntilCount(rule.count || 1)
    }

    if (rule.byweekday) setDaysToRepeat(rule.byweekday.map(String))
    else setDaysToRepeat(['0', '1', '2', '3', '4', '5', '6'])
  }, [internalRule])
 
  //Handle internal changes and pass back string to parent through onChange callback
  useEffect(() => {
    const handleChange = () => {
      const dayAfterTransaction = new Date(date)
      dayAfterTransaction.setDate(dayAfterTransaction.getDate() + 1)
      let untilRule: Date = dayAfterTransaction
      
      switch (repeatUntilMode) {
        case 'forever':
          untilRule = new Date('9999-12-31')
          break
           
          case 'until':
            if (untilDate !== '') untilRule = new Date(untilDate)
          break
      }
  
      //Create byweekday rule from daysToRepeat data
      let weekdayRule: Weekday[] = []
      daysToRepeat.forEach(day => {
        switch (day) {
          case '6':
            weekdayRule.push(RRule.SU)
            return 
          case '0':
            weekdayRule.push(RRule.MO)
            return 
          case '1':
            weekdayRule.push(RRule.TU)
            return 
          case '2':
            weekdayRule.push(RRule.WE)
            return 
          case '3':
            weekdayRule.push(RRule.TH)
            return 
          case '4':
            weekdayRule.push(RRule.FR)
            return 
          case '5':
            weekdayRule.push(RRule.SA)
            return 
        }
      })
      
      const rule = new RRule({
        freq: freq,
        interval: interval,
        ...(
            ((repeatUntilMode === 'forever') || (repeatUntilMode === 'until')) 
            ? 
            { until: untilRule } 
            : 
            { count: untilCount }
        ),
        ...((freq === RRule.DAILY) && (weekdayRule.length < 7) && { byweekday: weekdayRule }),
      })
  
      if (rule.toString() !== value) onChange(rule.toString())
    }

    if (!disabled) handleChange()
  }, [date, disabled, freq, interval, untilDate, untilCount, daysToRepeat, repeatUntilMode, onChange, value])

  return (
    <Box 
    display='flex' 
    flexDirection='column' 
    alignItems='start' 
    gap={2}
    component='fieldset'
    id={id}
    name={id}
    border='1px solid'
    borderRadius='0.25rem'
    sx={{
      borderColor: disabled ? 'rgba(0,0,0,0.38)' : 'black',
    }}
    >
      <legend style={{ 
        color: disabled ? 'rgba(0,0,0,0.38)' : 'black',
        fontSize: '0.8rem'
      }}>
        {label || `Recurrence Details`}
      </legend>

      <Box display='flex' justifyContent='end' width='100%'>
        {editButton}
      </Box>

      <FormControlLabel 
      label='Repeat every' 
      labelPlacement='start'
      sx={{ margin: 0 }}
      disabled={disabled}
      control={
      <>
          <Select 
          disabled={disabled}
          value={freq.toString()} 
          onChange={handleSetFreq} 
          sx={{ marginLeft: '0.5rem', display: 'inline-block' }}
          >
            <MenuItem value={RRule.YEARLY.toString()}>Year(s)</MenuItem>
            <MenuItem value={RRule.MONTHLY.toString()}>Month(s)</MenuItem>
            <MenuItem value={RRule.WEEKLY.toString()}>Week(s)</MenuItem>
            <MenuItem value={RRule.DAILY.toString()}>Day(s)</MenuItem>
          </Select>

          <TextField 
          disabled={disabled}
          value={interval} 
          onChange={handleSetInterval}
          type='number' 
          id="test"
          sx={{ marginLeft: '0.5rem', width: '6rem', display: 'inline-block' }} 
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </>
      } />
      {/* TODO: put "On the xxth of month" when it's monthly  */}

      <Box display='flex' justifyContent='center' width='100%'>
        {renderFreqOptions()}
      </Box>

      <FormControlLabel 
      disabled={disabled}
      control={
        <>
          {
            (repeatUntilMode === 'for') 
            && 
            <Typography color={disabled ? 'rgba(0,0,0,0.38)' : 'black'}>&nbsp;occurrence(s)</Typography>
          }

          {
            (repeatUntilMode === 'for') 
            && 
            <TextField 
            disabled={disabled}
            value={untilCount} 
            onChange={handleSetUntilCount} 
            type='number' 
            sx={{ marginLeft: '0.5rem', width: '6rem' }} 
            />
          }
          
          {
            (repeatUntilMode === 'until') 
            && 
            <TextField 
            disabled={disabled}
            value={untilDate} 
            onChange={handleSetUntilDate} 
            type='date' 
            inputProps={{ min: toBasicDateString(date) }}
            sx={{ marginLeft: '0.5rem' }} 
            />
          }
          
          <Select 
          disabled={disabled}
          value={repeatUntilMode} 
          onChange={handleSetRepeatUntilMode} 
          sx={{ marginLeft: '0.5rem' }}
          >
            <MenuItem value='forever'>forever</MenuItem>
            <MenuItem value='for'>for</MenuItem>
            <MenuItem value='until'>until</MenuItem>
          </Select>
        </>
      } 
      sx={{margin: 0}} 
      label="Repeat this event" 
      labelPlacement='start'
      />
    </Box>
  )
}