import { useEffect, useState } from "react"
import { useTheme } from "@mui/material/styles"

import type { ChartData } from "chart.js"

export default function GraphData (dailyCashPosition: number[] ): ChartData<'line'> {
  const theme = useTheme()
  const [xAxisLabels, setXAxisLabels] = useState<number[]>([])

  useEffect(() => {
    setXAxisLabels([...Array(dailyCashPosition.length).keys()])
  }, [dailyCashPosition])

  const dataToGraph: ChartData<'line'> = {
    labels: xAxisLabels,
    datasets: [
      {
        label: 'cash',
        //TODO: User selectable color
        borderColor: theme.palette.secondary.dark,
        borderWidth: 3,
        cubicInterpolationMode: "monotone",
        fill: {
          target: 'origin',
          above: theme.palette.primary.light,
          below: theme.palette.tertiary.dark
        },
        normalized: true,
        pointHitRadius: 10,
        data: dailyCashPosition,
        pointBackgroundColor: (context: { dataIndex: any; dataset: { data: any[] } }) => {
          const index = context.dataIndex
          const amount = context.dataset.data[index]
          const lastDayAmount = context.dataset.data[index-1]
          
          if (amount > lastDayAmount) return theme.palette.primary.main
          else if (amount === lastDayAmount) return 'black'
          else return theme.palette.tertiary.light
        },
        pointRadius: (context: { dataIndex: any; dataset: { data: any[] } }) => {
          const index = context.dataIndex
          const amount = context.dataset.data[index]
          const lastDayAmount = context.dataset.data[index-1]
          
          if (amount === lastDayAmount) return 0
          else return 4
        },
        pointHoverRadius: (context: { dataIndex: any; dataset: { data: any[] } }) => {
          const index = context.dataIndex
          const amount = context.dataset.data[index]
          const lastDayAmount = context.dataset.data[index-1]
          
          if (amount === lastDayAmount) return 4
          else return 8
        }
      }
    ],
  }

  return dataToGraph
}