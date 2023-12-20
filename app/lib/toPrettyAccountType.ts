import { AccountType } from "../types";

export default function toPrettyAccountType (type: AccountType): string {
  switch (type) {
    case 'creditCard':
      return "Credit Card"

    case 'checking':
      return "Checking"

    case 'savings':
      return "Savings"

    case 'loan':
      return "Loan"
  }
}