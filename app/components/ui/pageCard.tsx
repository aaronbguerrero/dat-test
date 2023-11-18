import { Box, Card, CardProps } from "@mui/material"

interface Props extends CardProps {

}

export default function PageCard ({ children }: Props) {
  return (
    <Box padding='1rem' display='flex' justifyContent='center'>
      <Card
      sx={{
        minWidth: { xs: '100%', lg: '30rem' },
        maxWidth: { xs: '100%', lg: '50rem' },
        padding: '1rem',
      }}
      >
        {children}
      </Card>
    </Box>
  )
}