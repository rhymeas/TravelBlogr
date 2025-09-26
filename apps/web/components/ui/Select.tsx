"use client"
import * as React from 'react'

// Minimal stub components to unblock build. Replace with a real Select later.
export function Select({ value, onValueChange, children }: any) {
  return <div data-select>{children}</div>
}
export function SelectTrigger({ children, className }: any) {
  return <button className={className} type="button">{children}</button>
}
export function SelectValue({ placeholder }: any) {
  return <span>{placeholder ?? ''}</span>
}
export function SelectContent({ children }: any) {
  return <div>{children}</div>
}
export function SelectItem({ children, value }: any) {
  return <div data-value={value}>{children ?? String(value)}</div>
}

