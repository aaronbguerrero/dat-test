import SubmittableDialog, { SubmittableDialogProps, useSubmittableDialog } from "./submittableDialog";

interface TemplateDialogProps {
  dialogProps: SubmittableDialogProps,
  open: () => void,
}

export default function TemplateDialog ({ dialogProps }: TemplateDialogProps) {

  return (
    <SubmittableDialog
    title="TEMPLATE"
    actionLabel="TEMPLATE"
    {...dialogProps}
    >
      TEMPLATE CONTENT
    </SubmittableDialog>
  )
}

export function useTemplateDialog (onSubmit: () => Promise<boolean>) {
  const handleSubmit = async () => {
    const response = onSubmit()
    .then(response => {
      if (response === true) console.log('SUBMITTED')
      return response
    })
    return response
  }
  const handleCancel = () => {
    console.log('CANCELLED')
  }

  const handleOpen = () => {
    //Add any data that needs to be passed in here
    dialogHook.open()
  }

  const dialogHook = useSubmittableDialog(handleSubmit, handleCancel)

  const dialogProps: TemplateDialogProps = {
    dialogProps: dialogHook,
    open: handleOpen,
  }

  return dialogProps
}