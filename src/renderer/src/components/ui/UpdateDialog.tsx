/**
 * UpdateDialog
 *
 * Shown when an update has been fully downloaded and is ready to install.
 * The user can restart immediately or dismiss and be reminded next launch.
 */

import React from 'react'

interface Props {
  version: string
  onInstall: () => void
  onDismiss: () => void
}

export function UpdateDialog({ version, onInstall, onDismiss }: Props): React.JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Update ready"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 32,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface, #1a1a1f)',
          border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          padding: '16px 20px',
          maxWidth: 380,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'all',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--color-text-primary, #f0f0f0)',
            }}
          >
            scriptOdd {version} is ready
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 12,
              color: 'var(--color-text-secondary, #999)',
            }}
          >
            Restart the app to finish installing the update.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              color: 'var(--color-text-secondary, #999)',
              border: '1px solid var(--color-border, rgba(255,255,255,0.15))',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Later
          </button>
          <button
            onClick={onInstall}
            style={{
              background: 'var(--color-accent, #6366f1)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Restart &amp; Install
          </button>
        </div>
      </div>
    </div>
  )
}
