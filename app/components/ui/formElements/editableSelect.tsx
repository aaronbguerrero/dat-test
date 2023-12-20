import { Box } from "@mui/material"
import EditButton from "../buttons/editButton"
import React, { ChangeEvent, ChangeEventHandler } from "react"
import useEditable from "../../../lib/useEditable"
import InputField, { InputFieldProps } from "./inputField"

type Props = Omit<InputFieldProps, 'onSubmit'> & {

  onSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  isEditingFlag?: (isEditing: boolean) => void,
}

export default function EditableSelect ({
  children,
  value, 
  onSubmit, 
  disabled, 
  isEditingFlag,
  required,
  id,
}: Props) {

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)  
  }

  const handleSubmit = (value: string) => {
    return onSubmit(value, id)
  }

  const { 
    value: internalValue, 
    onChange, 
    onEditButtonClick, 
    isEditable 
  } = useEditable(handleSubmit, value, isEditingFlag)

  return (
    <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
      <InputField
      id={id}
      select
      disabled={!isEditable}
      value={internalValue}
      onChange={handleChange}
      required={required}
      >
        {children}
      </InputField>

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