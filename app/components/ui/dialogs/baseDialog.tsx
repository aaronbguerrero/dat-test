import React, { ReactNode, useState } from "react"
import { Dialog, DialogProps, SxProps } from "@mui/material"

export interface BaseDialogProps {
  children?: ReactNode,
  props?: DialogProps,
  onClose: () => void,
  borderColor?: string,
  sx?: SxProps,
  isOpen: boolean,
  open: () => void,
  close: () => void,
}

export default function BaseDialog ({ 
  children, 
  borderColor, 
  isOpen, 
  open,
  close,
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
      {children}
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