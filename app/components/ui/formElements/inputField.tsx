import { TextField, TextFieldProps } from "@mui/material"
import { ChangeEvent, useEffect, useState } from "react"
import { z } from 'zod'

export type InputFieldProps = TextFieldProps & {
  label?: string,
  value?: string,
  schema?: z.ZodTypeAny,
  errorState?: boolean,
  helperText?: string,
  // revalidate?: () => void,
}

export default function InputField ({ 
  children,
  label, 
  value, 
  onChange, 
  name, 
  schema, 
  variant, 
  type, 
  disabled, 
  required, 
  select,
  // revalidate, 
  errorState,
  helperText,
  autoComplete,
  InputProps,
}: InputFieldProps) {
  const [internalValue, setInternalValue] = useState(value || '')

  const [internalErrorState, setInternalErrorState] = useState<boolean>(errorState ||  false)
  const [internalHelperText, setInternalHelperText] = useState<string>(helperText || '')

  const internalOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInternalErrorState(false)

    if (onChange) onChange(event)
    else {
      //If schema, validate input
      if (schema) {
        const parseResult = schema.safeParse(event.target.value)
        if (parseResult.success === false) {
          setInternalHelperText(parseResult.error.issues[0].message)
          setInternalErrorState(true)
        }
        else {
          setInternalErrorState(false)
          setInternalHelperText('')
          setInternalValue(parseResult.data)
        }
      }
      
      else setInternalValue(event.target.value)
    }
  }

  useEffect(() => {
    if (value) setInternalValue(value)
  }, [value])

  useEffect(() => {
    if (errorState) setInternalErrorState(errorState)
  }, [errorState, internalErrorState])

  useEffect(() => {
    if (helperText) setInternalHelperText(helperText)
  }, [helperText, internalHelperText])

  return (
        <TextField 
        name={name}
        fullWidth
        label={label} 
        variant={variant || 'outlined'}
        type={type || 'text'}
        disabled={disabled} 
        value={internalValue}
        onChange={internalOnChange}
        error={internalErrorState} 
        helperText={internalHelperText}
        InputProps={{
          autoComplete: autoComplete,
          ...InputProps,
        }}
        required={required}
        select={select}
        >
          {children}
        </TextField>
  )
}