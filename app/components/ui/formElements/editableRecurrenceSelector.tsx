import { Box } from "@mui/material"
import { useEffect, useState } from "react"
import RecurrenceSelector from "./recurrenceSelector"
import EditButton from "../buttons/editButton"
import RemoveButton from "../buttons/removeButton"
import ConfirmationDialog, { useConfirmationDialog } from "../dialogs/confirmationDialog"
import { Transaction } from "../../../types"

interface PropsWithoutInitialValue { 
  transaction: Transaction,
  onSubmit: (newValue: string, label: string) => Promise<boolean>,
  onRemove?: () => Promise<boolean>,
  label?: string,
  isEditingFlag?: (isEditing: boolean) => void,
  disabled?: boolean,
  editOnOpen?: boolean,
  id: string,
}

type PropsWithInitialValue = 
  | {
      value: string,
      date: Date,
    } 
  | {
      value?: never,
      date?: never,
    }

type Props = PropsWithoutInitialValue & PropsWithInitialValue


export default function EditableRecurrenceSelector ({ 
  transaction,
  value, 
  onSubmit, 
  onRemove, 
  label, 
  date, 
  isEditingFlag, 
  disabled,
  editOnOpen, 
  id,
}: Props) {
  const [originalValue, setOriginalValue] = useState(value || '')
  const [internalValue, setInternalValue] = useState(value || '')
  
  const [isEditable, setIsEditable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  //Allow to be editable on open
  //TODO: find a better way to do this
  useEffect(() => {
    setIsEditable(editOnOpen || false)
  }, [])

  const onClickAway = () => {
    if(isEditable) {
      setIsEditable(false)
    }
  }

  const handleEditButtonClick = async (event: 'cancel' | 'submit' | 'edit') => {
    switch (event) {
      case 'edit':
        setOriginalValue(internalValue)
        if (isEditingFlag) isEditingFlag(true)
        setIsEditable(true)
        break
        
      case 'cancel':
        setIsEditable(false)
        if (isEditingFlag) isEditingFlag(false)
        setInternalValue(originalValue)
        break

      case 'submit':
        setIsLoading(true)
        setIsEditable(false)

        await onSubmit(internalValue, id)
        .then(response => {
          setIsLoading(false)

          if (isEditingFlag) {
            if (response === true) isEditingFlag(false)
            
            else {
              setIsEditable(true)
            }
          }
        })
        break
    }
  }

  const handleRemoveRecurrenceClick = () => {
    confirmationDialog.open("Are you sure you'd like to remove the recurrence from the original transaction?")
  }

  const handleRemoveRecurrence = async () => {
    if (onRemove) {
      setIsLoading(true)

      const response = await onRemove()
      .then(response => {
        if (response === true) {
          setIsLoading(false)
          return true
        }

        else return false
      })

      return response
    }

    else return (false)
  }

  const onChange = (rule: string) => {
    setInternalValue(rule)
  }

  const confirmationDialog = useConfirmationDialog(handleRemoveRecurrence)

  return (
      <Box>
        <RecurrenceSelector 
        id={id}
        value={internalValue || ''} 
        onChange={onChange} 
        date={date || new Date} 
        disabled={!isEditable}
        editButton={
          <Box display='flex' justifyContent={(onRemove && originalValue !== '') ? 'space-between' : 'end'} width='100%'>
            {
              (onRemove && originalValue !== '') && 
              <RemoveButton 
              onClick={handleRemoveRecurrenceClick}
              tooltipText="Remove recurrence from transaction" 
              disabled={!isEditable} 
              />
            }

            <EditButton 
            onClick={handleEditButtonClick} 
            isEditable={isEditable} 
            isLoading={isLoading} 
            disabled={disabled} 
            />
          </Box>
        }
        label={label}
        />

        <ConfirmationDialog {...confirmationDialog} />
      </Box>
  )
}