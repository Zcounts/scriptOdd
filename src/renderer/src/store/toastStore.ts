/**
 * toastStore — Phase 8
 *
 * Minimal toast notification store for surfacing errors and status messages
 * to the user (save failures, export errors, open failures, etc.).
 */

import { create } from 'zustand'

export type ToastLevel = 'info' | 'success' | 'error'

export interface Toast {
  id: string
  message: string
  level: ToastLevel
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, level?: ToastLevel) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  push: (message, level = 'info') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, level }] }))
    // Auto-dismiss after 5 s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 5000)
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
