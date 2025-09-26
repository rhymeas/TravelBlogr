"use client"
import * as React from 'react'

// Minimal Dialog stubs to unblock build. Replace with a real Dialog later.
export function Dialog({ children }: any) {
  return <div data-dialog>{children}</div>
}
export function DialogTrigger({ children }: any) {
  return <div>{children}</div>
}
export function DialogContent({ children }: any) {
  return <div>{children}</div>
}
export function DialogHeader({ children }: any) {
  return <div>{children}</div>
}
export function DialogTitle({ children }: any) {
  return <h3>{children}</h3>
}

