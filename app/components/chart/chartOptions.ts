import { useTheme } from "@mui/material/styles"
import type { ChartOptions } from "chart.js"
import Dinero, { Currency } from 'dinero.js'
import { useEffect, useState } from "react"
import toPrettyDayOfWeekString from "../../lib/dates/toPrettyDayOfWeekString"

export default function ChartOptions (month: string, currencyUsed: Currency) {
  const theme = useTheme()

  const [today, setToday] = useState(0)
  useEffect(() => {
    const todaysDate = new Date()
    const currentMonth = new Date(month).getUTCMonth()
    if (todaysDate.getUTCMonth() === currentMonth) setToday(todaysDate.getDate())
    else setToday(0)
  }, [month])

  const ChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins:{
      annotation: {
        annotations: {
          baseline: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: 'black',
            borderWidth: 2,
          },
          todayLine: {
            type: 'line',
            xMin: today,
            xMax: today,
            //TODO: Make this green if cash pos and red if neg?
            borderColor: theme.palette.primary.dark,
            borderWidth: 1,
            display: (today === 0) ? false : true,
            label: {
              backgroundColor: theme.palette.secondary.dark,
              content: 'Today',
              display: true,
              position: 'end',
            },
          }
        }
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          callback: function(value, index, ticks) {
            if (value === 0)  return 'Starting'

            const date = new Date(month)
            // date.setUTCMonth(date.getUTCMonth())
            date.setUTCDate((typeof value === 'string') ? parseInt(value) : value )
            
            return toPrettyDayOfWeekString(date)
          }
        }
      },
      y: {
        ticks: {
          callback: function(value, index, ticks) {
            //Have to check if value is over 1 since ChartJS will auto assigned 0.1-1 labels until it has data
            //TODO: see if there's a better way to do this
            
            if (typeof value === 'number' && value >= 1) {
              const amount = Dinero({ 
                //TODO: Delete this line if bug doesn't pop up
                // amount: (typeof value === 'string') ? parseInt(value) : value, 
                amount: value, 
                currency: currencyUsed 
              })
              .toFormat('$0,0')

              return amount
            }
          }
        }
      }
    },
  }

  return ChartOptions
}