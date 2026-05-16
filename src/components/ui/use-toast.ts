import * as React from 'react'
import type { ToastProps } from './toast'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

let count = 0
function genId() { return `toast-${++count}` }

const listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []

function dispatch(toasts: ToasterToast[]) {
  memoryState = toasts
  listeners.forEach((l) => l(memoryState))
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  const id = genId()
  const newToast: ToasterToast = { ...props, id, open: true }
  dispatch([...memoryState.slice(-(TOAST_LIMIT - 1)), newToast])
  setTimeout(() => {
    dispatch(memoryState.map((t) => (t.id === id ? { ...t, open: false } : t)))
    setTimeout(() => {
      dispatch(memoryState.filter((t) => t.id !== id))
    }, 300)
  }, TOAST_REMOVE_DELAY)
  return id
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return { toasts, toast }
}
