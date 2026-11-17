import { useContext } from 'react'
import { ToastContext } from '../lib/toastContext'

/** Returns `toast(message, type?)` where type is 'success' (default) or 'error'. */
export function useToast() {
  return useContext(ToastContext).toast
}
