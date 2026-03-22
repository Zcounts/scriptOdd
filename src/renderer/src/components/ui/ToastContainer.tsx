/**
 * ToastContainer — Phase 8
 *
 * Renders active toast notifications in the bottom-right corner.
 */

import React from 'react'
import { useToastStore, type Toast } from '../../store/toastStore'

function ToastItem({ toast }: { toast: Toast }): React.JSX.Element {
  const { dismiss } = useToastStore()

  const bg =
    toast.level === 'error'
      ? 'bg-red-700'
      : toast.level === 'success'
        ? 'bg-green-700'
        : 'bg-so-surface'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg text-white text-sm max-w-xs ${bg}`}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => dismiss(toast.id)}
        className="opacity-70 hover:opacity-100 text-white leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer(): React.JSX.Element {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return <></>

  return (
    <div
      className="fixed bottom-6 right-6 z-[9000] flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
