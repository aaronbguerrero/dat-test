import { 
  Box, 
  Button, 
  DialogContent, 
  DialogTitle, 
} from "@mui/material"
import BaseDialog, { BaseDialogProps, useDialog } from "./baseDialog"
import { useState } from "react"
import SpinnerBackdrop from "../spinnerBackdrop"

export type SubmittableDialogProps = Omit<BaseDialogProps, 'open' | 'close' | 'dialogProps' | 'onSubmit'> & { 
  dialogProps: BaseDialogProps, 
  onSubmit: () => Promise<boolean>,
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
  dialogProps,
  close, 
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
        close()
        setIsLoading(false)
      }
      else {
        setIsLoading(false)
      }
    })
  }

  return (
    <BaseDialog title={title} borderColor={borderColor} {...dialogProps} onClose={close}>
        <SpinnerBackdrop isLoading={isLoading || false} />

        <Box display='flex' flexDirection='column' alignItems='center' gap={2}>
          <Box>
            {children}
          </Box>

          <Box display='flex' gap={2} marginTop='1rem' width='100%'>
            <Button 
            color={cancelColor || 'error'} 
            variant='contained' 
            onClick={close} 
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
      </BaseDialog>
  )
}

export function useSubmittableDialog (onSubmit: () => Promise<boolean>, onCancel?: () => void) {
  const dialogHook = useDialog()

  const handleOpen = () => {
    dialogHook.open()
  }

  const handleClose = () => {
    dialogHook.close()
    
    if (onCancel) onCancel()
  }

  const dialogProps: SubmittableDialogProps = {
    ...dialogHook,
    dialogProps: dialogHook,
    onSubmit: onSubmit,
    open: handleOpen,
    close: handleClose,
  }

  return dialogProps
}