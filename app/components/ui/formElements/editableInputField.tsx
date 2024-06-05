import { ChangeEvent, useState } from "react"
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
  isEditingFlag,
}: Props) {
  
  const handleSubmit = (value: string) => {
    return onSubmit(value, id)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
      }

  const [clearErrors, setClearErrors] = useState(false)

  const handleIsEditingFlag = (isEditing: boolean) => {
    if (isEditing === false) {
      setClearErrors(true)
    }

    else setClearErrors(false)

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
      schema={schema}
        fullWidth
        label={label} 
        variant={variant || 'outlined'}
        type={type || 'text'}
        disabled={!isEditable} 
        value={internalValue}
        onChange={handleChange}
      clearErrors={clearErrors}
        InputProps={{
          endAdornment: (editable !== false) && 
          <InlineEditButton 
        key={id}
          isLoading={isLoading} 
          isEditable={isEditable} 
          onClick={onEditButtonClick}
          disabled={disabled}
          />
        }}
        />
      {/* </ClickAwayListener> */}
    </form>
  )
}