import { ChangeEvent, useState } from "react"
import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog"

export type ConfirmationDialogProps = { 
  dialogProps: SubmittableDialogProps,
  title?: string,
  body?: string,
  confirmLabel?: string,
  cancelLabel?: string,
  open: (title: string, body?: string) => void,
}

export default function ConfirmationDialog ({ 
  dialogProps,
  title,
  body,
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
      {body}
    </SubmittableDialog>
  )
}

export function useConfirmationDialog (onConfirm: () => Promise<boolean>, onCancel?: () => Promise<boolean>) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handleOpen = (title: string, body?: string) => {
    setTitle(title)
    setBody(body || '')
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
    body: body,
    open: handleOpen,
  } 

  return dialogProps
}