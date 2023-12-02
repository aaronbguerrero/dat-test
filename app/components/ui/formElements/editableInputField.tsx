import { ClickAwayListener, TextField, TextFieldProps } from "@mui/material"
import { ChangeEvent, useEffect, useState } from "react"
import InlineEditButton from "../buttons/inlineEditButton"

import { z } from 'zod'
import useEditable from "../../../lib/useEditable"
import InputField from "./inputField"

type Props = Omit<TextFieldProps, 'onSubmit'> & {
  label: string,
  value: string,
  id: string,
  schema?: z.ZodTypeAny,
  onSubmit: (value: string, property: string | undefined) => Promise<boolean>,
  editable?: boolean,
  disabled?: boolean,
  isEditingFlag?: (isEditing: boolean) => void,
}

export default function EditableInputField ({ 
  id, 
  label, 
  value, 
  schema, 
  onSubmit, 
  editable, 
  variant, 
  type, 
  disabled, 
  isEditingFlag 
}: Props) {
  
  const [errorState, setErrorState] = useState<boolean>(false)
  const [helperText, setHelperText] = useState('')

  const handleSubmit = (value: string) => {
    return onSubmit(value, id)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorState(false)
    
    //If schema, validate input
    if (schema) {
      const parseResult = schema.safeParse(event.target.value)

      if (parseResult.success === false) {
        setHelperText(parseResult.error.issues[0].message)
        setErrorState(true)
      }

      else {
        setErrorState(false)
        setHelperText('')

        onChange(parseResult.data as string)
      }
    }

    else onChange(event.target.value)
  }

  const handleIsEditingFlag = (isEditing: boolean) => {
    if (isEditing === false) {
      setErrorState(false)
      setHelperText('')
    }

    if (isEditingFlag) isEditingFlag(isEditing)
  }

  const { 
    value: internalValue, 
    onChange,
    onEditButtonClick, 
    isEditable, 
    isLoading, 
  } = useEditable(handleSubmit, value, handleIsEditingFlag)

  // const onClickAway = () => {
  //   if(isEditable) {
  //     setIsEditable(false)
  //     setInternalValue(originalValue)
  //   }
  // }

  //TODO: Add back click away listener?
  return (
    <form style={{ width: '100%' }}>
      {/* <ClickAwayListener onClickAway={onClickAway}> */}
        <InputField 
        id={id}
        fullWidth
        label={label} 
        variant={variant || 'outlined'}
        type={type || 'text'}
        disabled={!isEditable} 
        value={internalValue}
        onChange={handleChange}
        InputProps={{
          endAdornment: (editable !== false) && 
          <InlineEditButton 
          isLoading={isLoading} 
          isEditable={isEditable} 
          onClick={onEditButtonClick}
          disabled={disabled}
          />
        }}
        //TODO: Pass in error state and helper text?? (override internal)
        errorState={errorState} 
        helperText={helperText}
        />
      {/* </ClickAwayListener> */}
    </form>
  )
}