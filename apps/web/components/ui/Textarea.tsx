"use client"
import * as React from 'react'

// Minimal Textarea to unblock build. Replace with a styled version later.
export function Textarea(props: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'popover'>) {
  return <textarea {...props} />
}

