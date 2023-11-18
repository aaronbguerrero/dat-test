import { 
  Box, 
  Button, 
  DialogContent, 
  DialogTitle, 
} from "@mui/material"
import BaseDialog from "./baseDialog"
import { useState } from "react"
import SpinnerBackdrop from "../spinnerBackdrop"

export type SubmittableDialogProps = { 
  isOpen: boolean,
  onClose: () => void,
  onSubmit: () => Promise<boolean>,
  title?: string,
  children?: React.ReactNode,
  actionLabel?: string,
  cancelLabel?: string,
  actionColor?: "inherit" | "error" | "primary" | "secondary" | "success" | "info" | "warning" | undefined,
  cancelColor?: "inherit" | "error" | "primary" | "secondary" | "success" | "info" | "warning" | undefined,
  submitDisabled?: boolean,
  borderColor?: string,
  open: () => void,
  close: () => void,
}

export default function SubmittableDialog ({ 
  isOpen, 
  onClose, 
  onSubmit,
  title, 
  children, 
  actionLabel, 
  cancelLabel, 
  actionColor, 
  cancelColor,
  submitDisabled,
  borderColor,
}: SubmittableDialogProps) {

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = () => {
    setIsLoading(true)
    onSubmit()
    .then(response => {
      if (response === true) {
        onClose()
        setIsLoading(false)
      }
      else {
        setIsLoading(false)
      }
    })
  }

  return (
    <BaseDialog open={isOpen} onClose={onClose} borderColor={borderColor}>
        <SpinnerBackdrop isLoading={isLoading || false} />

        <DialogContent> 
          {
            title &&
            <DialogTitle marginBottom='1rem'>
              {title}
            </DialogTitle>
          }

          <Box display='flex' flexDirection='column' alignItems='center' gap={2}>
            <Box>
              {children}
            </Box>

            <Box display='flex' gap={2} marginTop='1rem' width='100%'>
              <Button 
              color={cancelColor || 'error'} 
              variant='contained' 
              onClick={onClose} 
              fullWidth
              >
                {cancelLabel || "Cancel"}
              </Button>

              <Button 
              disabled={submitDisabled}
              color={actionColor || 'secondary'} 
              variant='contained' 
              onClick={handleSubmit} 
              fullWidth
              >
                {actionLabel || "Submit"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </BaseDialog>
  )
}

export function useSubmittableDialog (onSubmit: () => Promise<boolean>, onCancel?: () => void) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    
    if (onCancel) onCancel()
  }

  const dialogProps: SubmittableDialogProps = {
    isOpen: isOpen,
    onClose: handleClose,
    onSubmit: onSubmit,
    open: handleOpen,
    close: handleClose,
  }

  return dialogProps
}