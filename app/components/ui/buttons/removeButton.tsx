import { RemoveCircleOutlineTwoTone } from "@mui/icons-material"
import { IconButton, IconButtonProps, Tooltip } from "@mui/material"

interface Props extends IconButtonProps {
  tooltipText?: string,
}

export default function RemoveButton ({ disabled, tooltipText, onClick }: Props) {
  return (
    <Tooltip title={tooltipText || "Remove"}>
      <span>
        <IconButton onClick={onClick} color='warning' disabled={disabled}>
          <RemoveCircleOutlineTwoTone />
        </IconButton>
      </span>
    </Tooltip>
  )
}