import { AccountBalanceTwoTone, CreditCardTwoTone, RequestQuoteTwoTone, SavingsTwoTone } from "@mui/icons-material"

import type { AccountType } from "../../types"

type Props = {
  type: AccountType,
}

export default function AccountIcon ({ type }: Props) {
  switch (type) {
    case 'checking':
      return <AccountBalanceTwoTone />
      
    case 'creditCard':
      return <CreditCardTwoTone />
      
    case 'savings':
      return <SavingsTwoTone />
      
    case 'loan':
      return <RequestQuoteTwoTone />
  }

  return null
}