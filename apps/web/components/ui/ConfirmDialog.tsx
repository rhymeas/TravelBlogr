'use client'

import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'bg-gray-100 text-gray-600',
      button: 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500'
    },
    warning: {
      icon: 'bg-gray-100 text-gray-600',
      button: 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500'
    },
    info: {
      icon: 'bg-gray-100 text-gray-600',
      button: 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-5 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${styles.icon}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="mt-3 text-center">
            <h3 className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-gray-600">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

