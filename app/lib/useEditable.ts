import { useEffect, useState } from "react"

//1. takes in original value, displays it 
//2. on change will: 
  //set original value in state before change 
  // Run any callbacks (validate)
  //on cancel or close will change back to original value 
//3b. submit will submit
  //lock editing 
  //display loading state 
  //display error/completion
    //if error open editing again
//4. display passed in value again

export default function useEditable (
  onSubmit: (value: string) => Promise<boolean>,
  value?: string, 
  // changeCallback?: (value: string) => Promise<string | undefined>, 
  isEditingFlag?: (isEditing: boolean) => void,
) {
  const [originalValue, setOriginalValue] = useState(value || '')
  const [internalValue, setInternalValue] = useState(value || '')

  const [isEditable, setIsEditable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const onChange = async (newValue: string) => {
    //TODO: Implement
    // //If changeCallback, do it, then set value
    // if (changeCallback) {
    //   const response = await changeCallback(newValue || '') 

    //   if (response) setInternalValue(response)
    // }
    // else setInternalValue(newValue || '')
    setInternalValue(newValue)
  }

  const handleButtonClick = (event: 'cancel' | 'submit' | 'edit') => {
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
        if (isEditingFlag) isEditingFlag(false)

        onSubmit(internalValue)
        .then(response => {
          if (response === true) setIsLoading(false)
          else {
            setIsLoading(false)
            if (isEditingFlag) isEditingFlag(true)
            setIsEditable(true)
          }
        })
        break
    }
  }

  const handleSetIsEditable = (value: boolean) => {
    setIsEditable(value)
  }

  const handleSetIsLoading = (value: boolean) => {
    setIsLoading(value)
  }

  useEffect(() => {
    if (value && !isEditable) {
      setInternalValue(value)
    }
  }, [isEditable, value])

  const editableProps = {
    value: internalValue,
    onChange: onChange,
    onEditButtonClick: handleButtonClick,
    isEditable: isEditable,
    setIsEditable: handleSetIsEditable,
    isLoading: isLoading,
    setIsLoading: handleSetIsLoading,
  }

  return editableProps
}