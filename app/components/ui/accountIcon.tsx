import { AccountBalanceTwoTone, CreditCardTwoTone, RequestQuoteTwoTone, SavingsTwoTone } from "@mui/icons-material"

import type { AccountType } from "../../types"

type Props = {
  color?: string,
  type: AccountType,
}

export default function AccountIcon ({ color, type }: Props) {
  switch (type) {
    case 'checking':
      return <AccountBalanceTwoTone sx={{ color: color }} />
      
    case 'creditCard':
      return <CreditCardTwoTone sx={{ color: color }} />
      
    case 'savings':
      return <SavingsTwoTone sx={{ color: color }} />
      
    case 'loan':
      return <RequestQuoteTwoTone sx={{ color: color }} />
  }
}