import { Autocomplete, InputAdornment, TextField } from "@mui/material"

import currencies from '../../../../public/currencies.json'
const currencyOptions = ['']
currencyOptions.push(...currencies.map(currency => {return(currency.currency)}))

type CurrencySelectorProps = {
  id?: string,
  name?: string,
  value: string, 
  onChange: (event: React.SyntheticEvent<Element, Event>, newValue: string | null) => void, 
  label?: string, 
  endAdornment?: React.ReactNode,
  disabled?: boolean,
}

export default function CurrencySelector ({ 
  id, 
  name,
  value, 
  onChange, 
  label, 
  endAdornment, 
  disabled, 
}: CurrencySelectorProps) {
    
  return (
    <Autocomplete 
    fullWidth
    id={id}
    disabled={disabled}
    options={currencyOptions}
    value={value}
    onChange={onChange} 
    renderInput={
      (params) => (
        <TextField 
        {...params} 
        label={label || "Currency"} 
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              
              {endAdornment}
            </>
          ),
          startAdornment: (
            <InputAdornment position='start'>
              <div>{params.InputProps.endAdornment}</div>
            </InputAdornment>
          )
        }}
        />
      )
    }
    //renderOption to fix keys error caused by NextJS
    renderOption={(props, option) => {
      return (
        <li {...props} key={option}>
          {option}
        </li>
      )
    }}
    sx={{ 
      minWidth: { xs: '8rem', lg: '10rem' },
      }}
    />
  )
}