import { ChangeEvent, useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

interface ConfirmationDialogProps { 
  dialogProps: SubmittableDialogProps,
  title: string,
  confirmLabel?: string,
  cancelLabel?: string,
  open: (title: string) => void,
}

export default function ConfirmationDialog ({ 
  dialogProps,
  title,
  confirmLabel,
  cancelLabel
}: ConfirmationDialogProps) {

  return (
    <SubmittableDialog
    title={title}
    actionLabel={confirmLabel || "Confirm"}
    cancelLabel={cancelLabel}
    {...dialogProps}
    >
      
    </SubmittableDialog>
  )
}

export function useConfirmationDialog (onConfirm: () => Promise<boolean>, onCancel?: () => Promise<boolean>) {
  const [title, setTitle] = useState('')

  const handleOpen = (title: string) => {
    setTitle(title)
    dialogHook.open()
  }

  const handleConfirm = async () => {
    const response = onConfirm()
    .then(response => {
      if (response === true) setTitle('')
      return response
    })
    return response
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
  }

  const dialogHook = useSubmittableDialog(handleConfirm, handleCancel)

  const dialogProps: ConfirmationDialogProps = {
    dialogProps: dialogHook,
    title: title,
    open: handleOpen,
  } 

  return dialogProps
}