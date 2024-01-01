import { Card, CardHeader, Divider, IconButton, List, ListItemButton, ListItemIcon, Skeleton, Stack, Typography } from "@mui/material"
import useSWR from 'swr'
import { useEffect, useState } from "react"
import BasicToast, { useToast } from "../ui/toasts/basicToast"
import { Add } from "@mui/icons-material"
import AddAccountDialog, { useAddAccountDialog } from "../ui/dialogs/addAccountDialog"
import EditAccountDialog, { useEditAccountDialog } from "../ui/dialogs/editAccountDialog"
import AccountIcon from "../ui/accountIcon"

import type { Account, AccountType } from "../../types"

export default function AccountsCard ({}) {
  const toast = useToast()
  
  const {data: accounts, error: accountsError, mutate } = useSWR<Account[]>(`/api/accounts/getAccounts`)
  useEffect(() => {
  if (accountsError) toast.open("Sorry! There was a problem loading the month data. Please refresh the page.", 'error')
    else toast.close()
  }, [accountsError, toast])
  
  const [isAccountsLoading, setIsAccountsLoading] = useState(true)
  useEffect(() => {
    if (!accountsError && accounts !== undefined) {
      setIsAccountsLoading(false)
    }
  }, [accounts, accountsError, setIsAccountsLoading])
  
  const handleAddAccountClick = () => {
    addAccountDialog.open()
  }

  const handleAddAccount = async (title: string, type: AccountType, color: string) => {
    return await fetch(`/api/accounts/addAccount/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        type: type,
        color: color,
      })
    })
    .then(response => response.json())
    .then(response => {
      if (response.acknowledged === true) {
        mutate()

        toast.open("Account added successfully!", 'success')

        return true
      }
      else {
        toast.open("Sorry! There was a problem adding the account, please try again.", 'error')
        return false
      }
    })
  }
  
  const addAccountDialog = useAddAccountDialog(handleAddAccount)
  
  const handleEditAccountClick = (account: Account) => {
    editAccountDialog.open(account)
  }
  
  const editAccountDialog = useEditAccountDialog()

  return (
    <Card
    sx={{
      minWidth: { xs: '100%', lg: '30rem' },
      maxWidth: { xs: '100%', lg: '50rem' },
    }}
    >
      <CardHeader 
      title="Accounts" 
      action={
        <IconButton onClick={handleAddAccountClick}>
          <Add />
        </IconButton>
      } 
      />

      <Divider />

      <List>
        {isAccountsLoading ?
        <Skeleton height={50} />
        :
        accounts?.map(account => {
          return (
            <ListItemButton 
            key={account._id.toString()}
            onClick={() => handleEditAccountClick(account)}
            >
              <ListItemIcon sx={{ color: account.color }}>
                <AccountIcon type={account.type} />
              </ListItemIcon>

              <Typography>{account.title}</Typography>
            </ListItemButton>
          )
        })}
      </List>

      <BasicToast {...toast} />

      <AddAccountDialog {...addAccountDialog} />
      <EditAccountDialog {...editAccountDialog} />
    </Card>
  )
}