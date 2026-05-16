import { useState, useCallback } from 'react'

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ type = 'success', title, message }) => {
    const id = ++_id
    setToasts(p => [...p, { id, type, title, message }])
  }, [])

  const remove = useCallback(id => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, removeToast: remove }
}