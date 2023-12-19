import useSWR from 'swr'
import { ListItemIcon, MenuItem } from "@mui/material"
import AccountIcon from "../accountIcon"
import InputField, { InputFieldProps } from "./inputField"

import type { Account } from "../../../types"
import BasicToast, { useToast } from '../toasts/basicToast'
import { useEffect, useState } from 'react'

type Props = InputFieldProps

export default function AccountSelector ({ value, onChange, disabled }: Props) {
  const toast = useToast()
  
  //Get account data
  const { data: accounts, error: accountsError } = useSWR<Account[]>(`/api/accounts/getAccounts`)
  useEffect(() => {
    if (accountsError) {
      setError(true)
      toast.open("Sorry! There was a problem getting your account data. Please try again.", 'error')
    }

    else setError(false)
  }, [accountsError, toast])

  const [error, setError] = useState<boolean>(false)

  return (
    <>
      <InputField 
        name='account'
        value={value}
        fullWidth 
        select 
        label='Account'
        errorState={error}
        disabled={disabled}
        onChange={onChange}
        >
          {accounts?.map(account => {
            return <MenuItem 
            value={account._id.toString()}
            key={account._id.toString()}
            
            >
              <ListItemIcon>
                <AccountIcon type={account.type} />
              </ListItemIcon>
              {account.title}
            </MenuItem>
          })}

        </InputField>

        <BasicToast {...toast} />
      </>
  )
}