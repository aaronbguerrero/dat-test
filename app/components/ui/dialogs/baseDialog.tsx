import React, { ReactNode } from "react"
import { Dialog, DialogProps, PaperProps, SxProps } from "@mui/material"

export interface BaseDialogProps {
  children?: ReactNode;
  props?: DialogProps;
  open: boolean;
  onClose: () => void;
  borderColor?: string;
  sx?: SxProps;
}

export default function BaseDialog ({ children, borderColor, ...props }: BaseDialogProps) {
  return (
    <Dialog sx={{
      backdropFilter: 'blur(4px)',
    }}
    PaperProps={{
      style: { 
        border: `2px solid ${borderColor}` },
    }}
    {...props}>
      {children}
    </Dialog>
    
  )
}