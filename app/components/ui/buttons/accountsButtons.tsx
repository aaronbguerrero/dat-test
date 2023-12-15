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

export default function AccountsButtons ({ onChange, exclusive, orientation }: Props) {
  const toast = useToast()
  
  const { data: accounts, error: accountsError } = useSWR<Account[]>(`/api/accounts/getAccounts`)
  useEffect(() => {
    if (accountsError) {
      toast.open("Sorry! There was a problem loading your accounts, please refresh the page!", 'error')
    }
  }, [accountsError, toast])

  //Setup active accounts control
  const [activeAccounts, setActiveAccounts] = useState<string[]>([])
  useEffect(() => {
    if (accounts !== undefined) {
      //TODO: User set default account
      if (exclusive) setActiveAccounts([accounts[0]._id.toString()])
      else setActiveAccounts(accounts.map(account => {
        return account._id.toString()
      }))
  }
  }, [accounts, exclusive])
  
  const handleAccountsChange = (event: React.MouseEvent<HTMLElement>, newAccounts: string[]) => {
    setActiveAccounts(newAccounts)
  }
  
  useEffect(() => {
    onChange(activeAccounts)
  }, [activeAccounts, onChange])

  return (
    <Box padding='1rem'>
        <ToggleButtonGroup 
        value={activeAccounts}
        onChange={handleAccountsChange}
        orientation={orientation}
        exclusive={exclusive}
        size='small'
        >
          {accounts?.map(account => {
            return (
              <ToggleButton
              value={account._id.toString()}
              key={account._id.toString()}
              >
                <Tooltip title={account.title} placement='right'>
                  <Typography color={account.color}><AccountIcon type={account.type} /></Typography>
                </Tooltip>
              </ToggleButton>
            )
          })}
        </ToggleButtonGroup>

        <BasicToast {...toast} />
      </Box>
  )
}