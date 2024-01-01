import { Box } from "@mui/material"
import { useEffect } from "react"
import RecurrenceSelector, { RecurrenceSelectorProps } from "./recurrenceSelector"
import EditButton from "../buttons/editButton"
import RemoveButton from "../buttons/removeButton"
import ConfirmationDialog, { useConfirmationDialog } from "../dialogs/confirmationDialog"
import useEditable from "../../../lib/useEditable"

type Props = Omit<RecurrenceSelectorProps, 'onChange'> & {
  onSubmit: (newValue: string, newProperty: string) => Promise<boolean>,
  onRemove?: () => Promise<boolean>,
  isEditingFlag?: (isEditing: boolean) => void,
  editOnOpen?: boolean,
}

export default function EditableRecurrenceSelector ({ 
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
  const handleSubmit = async (newValue: string) => {
    return await onSubmit(newValue, id)
  }

  const { 
    value: internalValue, 
    onChange, 
    onEditButtonClick, 
    isEditable,
    setIsEditable,
    isLoading,
    setIsLoading,
  } = useEditable(handleSubmit, value, isEditingFlag)

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
          <Box display='flex' justifyContent={onRemove ? 'space-between' : 'end'} width='100%'>
            {
              onRemove && 
              <RemoveButton 
              onClick={handleRemoveRecurrenceClick}
              tooltipText="Remove recurrence from transaction" 
              disabled={!isEditable} 
              />
            }

            <EditButton 
            onClick={onEditButtonClick} 
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