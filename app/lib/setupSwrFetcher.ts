import { BasicToastProps, useToast } from "../components/ui/toasts/basicToast"

//TODO: MAKE THIS WORK
export default function setupSwrFetcher (errorMessage: string, toast: BasicToastProps) {   
  const fetcher = {
    fetcher: (url: string) => fetch(url)
    .then(response => {
      if (!response.ok) toast.open(errorMessage, 'error')
      
      return response.json()
    })
  }
  
  return fetcher
}