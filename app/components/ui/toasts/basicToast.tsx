import { Alert, Snackbar } from "@mui/material"
import { useState } from "react"

export type BasicToastProps = {
  isOpen?: boolean,
  onClose?: () => void,
  duration?: number | null,
  severity?: "success" | "error" | "info" | "warning",
  content?: string,
  open: (message: string, type?: "success" | "error" | "info" | "warning") => void,
  close: () => void,
}

export default function BasicToast ({ isOpen, onClose, duration, severity, content }: BasicToastProps) {
  let newDuration: number | null = 5000
  if ((duration === null) || (severity === 'error') || (severity === 'warning')) newDuration = null
  
  return (
    <Snackbar
      open={isOpen}
      onClose={onClose}
      autoHideDuration={newDuration}
      anchorOrigin={{ vertical: (severity === 'error') ? 'top' : 'bottom', horizontal: 'center' }}>
        <Alert variant='filled' severity={severity || 'info'} sx={{ border: 'solid white 1px' }}>
          {content}
        </Alert>
      </Snackbar>
  )
}

export function useToast () {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [localSeverity, setLocalSeverity] = useState<"success" | "error" | "info" | "warning">('info')

  const handleOpen = (message: string, severity?: "success" | "error" | "info" | "warning") => {
    setContent(message)
    if (severity) setLocalSeverity(severity)
    setIsOpen(true)
  }

  const handleClose = () => setIsOpen(false)

  const toastProps: BasicToastProps = {
    isOpen: isOpen,
    onClose: handleClose,
    content: content,
    severity: localSeverity,
    open: handleOpen,
    close: handleClose,
  }

  return toastProps
}