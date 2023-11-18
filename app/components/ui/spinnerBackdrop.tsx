import { Backdrop, CircularProgress } from "@mui/material"

type Props = {
  isLoading: boolean,
}

export default function SpinnerBackdrop ({ isLoading }: Props) {
  return (
    <Backdrop 
        open={isLoading || false} 
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        >
          <CircularProgress size='10vh' disableShrink />
        </Backdrop>
  )
}