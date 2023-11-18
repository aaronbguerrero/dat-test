import { createTheme, responsiveFontSizes, Theme } from "@mui/material/styles"

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
  }

  interface PaletteOptions {
    tertiary?: Palette['primary'];
  }
}

declare module '@mui/material/ToggleButton' {
  interface ToggleButtonPropsColorOverrides {
    tertiary: true;
  }
}

const defaultTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5EA437',
    },
    secondary: {
      main: '#2F5FB4',
    },
  }
})

const responsiveTheme = responsiveFontSizes(defaultTheme)

export const theme: Theme = createTheme(responsiveTheme, {
  palette: {
    tertiary: defaultTheme.palette.augmentColor({
      color: { main: '#E11841', },
      name: 'tertiary',
    })
  }
})