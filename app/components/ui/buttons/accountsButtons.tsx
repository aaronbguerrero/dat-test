import { AccountBalanceTwoTone, CreditCardTwoTone } from "@mui/icons-material"
import { Box, ToggleButton, ToggleButtonGroup, ToggleButtonGroupProps, Tooltip, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import useSWR from "swr"
import AccountIcon from "../accountIcon"
import BasicToast, { useToast } from "../toasts/basicToast"

import type { Account } from '../../../types'

type Props = Omit<ToggleButtonGroupProps, 'onChange'> & {
  onChange: (activeAccounts: string[]) => void,
}

export default function AccountsButtons ({ onChange, exclusive, orientation, sx }: Props) {
  const toast = useToast()
  
  const { data: accounts, error: accountsError } = useSWR<Account[]>(`/api/accounts/getAccounts`)
  useEffect(() => {
    if (accountsError) {
      toast.open("Sorry! There was a problem loading your accounts, please refresh the page!", 'error')
    }
    else if (toast.content === "Sorry! There was a problem loading your accounts, please refresh the page!") toast.close()
  }, [accountsError, toast])

  //Setup active accounts control
  const [activeAccounts, setActiveAccounts] = useState<string[]>([])
  useEffect(() => {
    if (accounts !== undefined) {
      //User set default account. If it doesn't exist it will default to the first account in the array.
      if (exclusive) {
        const defaultAccount = accounts.find(account => account.isDefault)?._id.toString() || accounts[0]._id.toString()
        setActiveAccounts([defaultAccount])
      }
      else setActiveAccounts(accounts.map(account => {
        return account._id.toString()
      }))
  }
  }, [accounts, exclusive])
  
  const handleAccountsChange = (event: React.MouseEvent<HTMLElement>, newAccounts: string | string[]) => {
    if (newAccounts) setActiveAccounts(Array.isArray(newAccounts) ? newAccounts : [newAccounts])
  }
  
  useEffect(() => {
    onChange(activeAccounts)
  }, [activeAccounts, onChange])

  return (
    <ToggleButtonGroup 
    value={activeAccounts}
    onChange={handleAccountsChange}
    orientation={orientation}
    exclusive={exclusive}
    size='small'
    sx={sx}
    >
      {accounts?.map(account => {
        return (
          <ToggleButton
          value={account._id.toString()}
          key={account._id.toString()}
          sx={{ borderRadius: '5%' }}
          >
            <Tooltip title={account.title} placement='right'>
              <Typography color={account.color}><AccountIcon type={account.type} /></Typography>
            </Tooltip>
          </ToggleButton>
        )
      })}
      
      <BasicToast {...toast} />
    </ToggleButtonGroup>
  )
}