import { AttachMoney, AttachMoneyTwoTone, MoneyOffTwoTone } from "@mui/icons-material"
import { ToggleButton, ToggleButtonGroup } from "@mui/material"

import type { ToggleButtonGroupProps } from "@mui/material"
import { useState } from "react"

type Props = ToggleButtonGroupProps & {
  value: string, 
  onChange: (event: React.MouseEvent<HTMLElement>, value: string) => Promise<boolean> | void, 
  label?: string,
  name?: string,
  props?: ToggleButtonGroupProps 
}

export default function ExpenseIncomeButtons ({ value, onChange, label, name, ...props }: Props) {
  const [isDisabled, setIsDisabled] = useState(false)

  const handleChange = async (event: React.MouseEvent<HTMLElement>, value: string) => {
    setIsDisabled(true)

    await onChange(event, value)

    setIsDisabled(false)
  }

  return (
    <ToggleButtonGroup
    size="small" 
    value={value} 
    onChange={handleChange}
    exclusive={true}
    disabled={isDisabled}
    {...props}>
      <ToggleButton value='expense' color='tertiary'>
        <MoneyOffTwoTone /> Expense
      </ToggleButton>

      <ToggleButton value='income' color='primary'>
        <AttachMoneyTwoTone /> Income
      </ToggleButton>
    </ToggleButtonGroup>
  )
}