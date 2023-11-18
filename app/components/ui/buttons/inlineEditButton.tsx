import { InputAdornment } from "@mui/material"
import EditButton, { EditButtonProps } from "./editButton";


export default function InlineEditButton ({ onClick, isEditable, isLoading, disabled }: EditButtonProps) {
  return (
    <InputAdornment position='end'>
      <EditButton 
      onClick={onClick} 
      isEditable={isEditable}
      isLoading={isLoading}
      disabled={disabled}
      />
    </InputAdornment>
  )
}