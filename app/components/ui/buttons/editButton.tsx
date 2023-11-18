import { CheckTwoTone, ClearTwoTone, EditTwoTone } from "@mui/icons-material"
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material"

export interface EditButtonProps {
  onClick: (event: 'cancel' | 'submit' | 'edit') => void,
  isEditable: boolean,
  isLoading?: boolean,
  disabled?: boolean,
}

export default function EditButton ({ onClick, isEditable, isLoading, disabled }: EditButtonProps) {
  if (isLoading) return <CircularProgress size={'1.25rem'} color='secondary' />

  if (isEditable && !isLoading) return (
    <Box display='flex' flexDirection='row'>
      <Tooltip title="Cancel">
        <span>
          <IconButton color='error' edge='start' size='small' onClick={() => onClick('cancel')}>
            <ClearTwoTone />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Submit">
        <span>
          <IconButton type='submit' color='success' size='small' onClick={() => onClick('submit')}>
            <CheckTwoTone />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )

  if (!isLoading && !isEditable) return (
    <Tooltip title="Edit">
      <span>
        <IconButton size='small' onClick={() => onClick('edit')} disabled={disabled}>
          <EditTwoTone />
        </IconButton>
      </span>
    </Tooltip>
  )

  return null
} 