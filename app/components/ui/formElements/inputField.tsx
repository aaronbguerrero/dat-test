import { TextField, TextFieldProps } from "@mui/material"
import { ChangeEvent, useEffect, useState } from "react"
import { z } from 'zod'

export type InputFieldProps = TextFieldProps & {
  label?: string,
  value?: string,
  schema?: z.ZodTypeAny,
  errorState?: boolean,
  helperText?: string,
  clearErrors?: boolean,
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
  errorState,
  helperText,
  clearErrors,
  autoComplete,
  InputProps,
  ref,
}: InputFieldProps) {
  const [internalValue, setInternalValue] = useState(value || '')

  const [internalErrorState, setInternalErrorState] = useState<boolean>(errorState ||  false)
  const [internalHelperText, setInternalHelperText] = useState<string>(helperText || '')

  const internalOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInternalErrorState(false)
    
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

        if (onChange) onChange(event)
        else setInternalValue(parseResult.data)
      }
    }

    else if (onChange) onChange(event)
    else setInternalValue(event.target.value)
  }
  
  //If value in props changes, apply to internal state
  useEffect(() => {
    if (value) setInternalValue(value)
  }, [value])

  //If errorState in props changes, apply to internal state
  useEffect(() => {
    if (errorState) {
      setInternalErrorState(errorState)
    }
  }, [errorState])

  //If helperText in props changes, apply to internal state
  useEffect(() => {
    if (helperText) {
      setInternalHelperText(helperText)
    }
  }, [helperText])

  //Clear error and helper text on trigger
  useEffect(() => {
    if (clearErrors) {
      setInternalErrorState(false)
      setInternalHelperText('')
    }
  }, [clearErrors])

  return (
    <TextField 
    ref={ref}
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