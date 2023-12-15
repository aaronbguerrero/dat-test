import useSWR from 'swr'
import { ListItemIcon, MenuItem } from "@mui/material"
import AccountIcon from "../accountIcon"
import InputField from "./inputField"

import type { Account } from "../../../types"
import BasicToast, { useToast } from '../toasts/basicToast'
import { useEffect, useState } from 'react'

export default function AccountSelector () {
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
        fullWidth 
        select 
        label='Account'
        errorState={error}
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