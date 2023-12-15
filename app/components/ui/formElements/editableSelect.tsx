import { Box, Select } from "@mui/material"
import { useState } from "react"
import EditButton from "../buttons/editButton"

type Props = {
  children: React.ReactNode,
  value: string,
}

export default function EditableSelect ({ children, value }: Props) {
  const [isEditable, setIsEditable] = useState(false)

  const handleEditButtonClick = (event: 'submit' | 'cancel' | 'edit') => {
    switch (event) {
      case 'submit':
        console.log('submit')
        break

      case 'edit':
        setIsEditable(true)
        break
        
        case 'cancel':
        setIsEditable(false)
        //TODO: RESET TO ORIGINAL
        break
    }
  }

  return (
    <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
      <Select 
      value={value}
      fullWidth
      disabled={!isEditable}
      >
        {children}
      </Select>

      <Box paddingX='1rem'>
        <EditButton 
        onClick={handleEditButtonClick} 
        isEditable={isEditable}  
        disabled={false}
        />
      </Box>
    </Box>
  )
}