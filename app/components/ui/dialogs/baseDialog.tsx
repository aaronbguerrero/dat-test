import React, { ReactNode, useState } from "react"
import { Box, Dialog, DialogContent, DialogProps, DialogTitle, IconButton } from "@mui/material"
import { CloseTwoTone } from "@mui/icons-material"

export type BaseDialogProps = Omit<DialogProps, 'open' | 'onSubmit' | 'title'> & {
  onClose: () => void,
  borderColor?: string,
  isOpen: boolean,
  open: () => void,
  close: () => void,
  title?: ReactNode,
}

export default function BaseDialog ({ 
  children, 
  borderColor, 
  isOpen, 
  open,
  close,
  title,
  ...props
}: BaseDialogProps) {
  return (
    <Dialog 
    open={isOpen}
    sx={{
      backdropFilter: 'blur(4px)',
    }}
    PaperProps={{
      style: { 
        border: `2px solid ${borderColor}` },
    }}
    {...props}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>{title}</Box>

          <Box>
            <IconButton onClick={close}>
              <CloseTwoTone />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
    
  )
}

export function useDialog (onClose?: () => void) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    
    if (onClose) onClose()
  }

  const dialogProps: BaseDialogProps = {
    isOpen: isOpen,
    onClose: handleClose,
    open: handleOpen,
    close: handleClose,
  }

  return dialogProps
}