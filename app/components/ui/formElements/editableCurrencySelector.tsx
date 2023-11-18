import CurrencySelector from "./currencySelector"
import { Box } from "@mui/material"
import EditButton from "../buttons/editButton"
import React from "react"
import useEditable from "../../../lib/useEditable"

type Props = {
  value?: string,
  id?: string,
  onSubmit: (value: string) => Promise<boolean>,
  disabled?: boolean,
  isEditingFlag?: (isEditing: boolean) => void,
}

export default function EditableCurrencySelector ({
   value, 
   id, 
   onSubmit, 
   disabled, 
   isEditingFlag 
}: Props) {
  const { 
    value: internalValue, 
    onChange, 
    onEditButtonClick, 
    isEditable 
  } = useEditable(onSubmit, value || 'USD', isEditingFlag)

  const handleChange = (event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    onChange(value || 'USD')  }
  
  return (
    <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
      <CurrencySelector 
      id={id}
      value={internalValue}
      onChange={handleChange}
      disabled={!isEditable}
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