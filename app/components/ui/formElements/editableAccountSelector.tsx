import { Box } from "@mui/material"
import EditButton from "../buttons/editButton"
import React, { ChangeEvent, ChangeEventHandler } from "react"
import useEditable from "../../../lib/useEditable"
import AccountSelector from "./accountSelector"
import { Transaction } from "../../../types"

type Props = {
  value?: string,
  id?: string,
  onSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  disabled?: boolean,
  isEditingFlag?: (isEditing: boolean) => void,
}

export default function EditableAccountSelector ({
   value, 
   onSubmit, 
   disabled, 
   isEditingFlag 
}: Props) {

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)  
  }

  const handleSubmit = (value: string) => {
    return onSubmit(value, 'account')
  }

  const { 
    value: internalValue, 
    onChange, 
    onEditButtonClick, 
    isEditable 
  } = useEditable(handleSubmit, value, isEditingFlag)

  return (
    <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
      <AccountSelector
      disabled={!isEditable}
      value={internalValue}
      onChange={handleChange}
      />

      <Box paddingX='1rem'>
        <EditButton 
        onClick={onEditButtonClick} 
        isEditable={isEditable}  
        disabled={disabled}
        />
      </Box>
    </Box>
    
  )
}