import { Box } from "@mui/material"
import EditButton from "../buttons/editButton"
import React, { ChangeEvent, ChangeEventHandler } from "react"
import useEditable from "../../../lib/useEditable"
import { MuiColorInput, MuiColorInputProps } from "mui-color-input"

type Props = Omit<MuiColorInputProps, 'onSubmit'> & {
  onSubmit: (newValue: string, property: string | undefined) => Promise<boolean>,
  isEditingFlag?: (isEditing: boolean) => void,
}

export default function EditableColorPicker ({
  value, 
  onSubmit, 
  disabled, 
  isEditingFlag,
  required,
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
  } = useEditable(handleSubmit, value.toString(), isEditingFlag)

  return (
    <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
      <MuiColorInput
       value={internalValue} 
       format='hex' 
       required={required}
       sx={{width: 'auto'}}
       disabled={disabled || !isEditable}
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