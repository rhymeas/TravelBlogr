'use client'

/**
 * InlineEdit Component
 * 
 * A reusable inline editing component with bubbly design and editing hints.
 * Follows TravelBlogr design system with rounded corners, soft shadows, and emerald accents.
 * 
 * Features:
 * - Bubbly rounded design with soft shadows
 * - Light gray hint tags ("Editing...", "Click to edit")
 * - Emerald border when editing
 * - Hover effects with background tint
 * - Support for text, textarea, and number inputs
 * - Optional placeholder for empty states
 * - Auto-save on blur or Enter key
 * - Customizable styling
 * 
 * Usage:
 * ```tsx
 * <InlineEdit
 *   value={tripTitle}
 *   onChange={setTripTitle}
 *   onSave={handleSave}
 *   placeholder="Enter trip title..."
 *   variant="title"
 * />
 * ```
 */

import { useState, useRef, useEffect } from 'react'

export interface InlineEditProps {
  /** Current value */
  value: string
  
  /** Callback when value changes */
  onChange: (value: string) => void
  
  /** Callback when value is saved (blur or Enter) */
  onSave?: (value: string) => void
  
  /** Placeholder text when empty */
  placeholder?: string
  
  /** Variant determines size and styling */
  variant?: 'title' | 'subtitle' | 'text' | 'small'
  
  /** Input type */
  type?: 'text' | 'textarea' | 'number'
  
  /** Maximum length for input */
  maxLength?: number
  
  /** Number of rows for textarea */
  rows?: number
  
  /** Custom class name for container */
  className?: string
  
  /** Disable editing */
  disabled?: boolean
  
  /** Show empty state with dashed border */
  showEmptyState?: boolean
  
  /** Custom hint text for editing state */
  editingHint?: string
  
  /** Custom hint text for hover state */
  hoverHint?: string
}

export function InlineEdit({
  value,
  onChange,
  onSave,
  placeholder = 'Click to edit...',
  variant = 'text',
  type = 'text',
  maxLength,
  rows = 3,
  className = '',
  disabled = false,
  showEmptyState = true,
  editingHint = 'Editing...',
  hoverHint = 'Click to edit'
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Select all text for easy replacement
      if (type !== 'textarea') {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleBlur = () => {
    setIsEditing(false)
    if (onSave) {
      onSave(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      setIsEditing(false)
      if (onSave) {
        onSave(value)
      }
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true)
    }
  }

  // Variant-specific styles
  const variantStyles = {
    title: {
      text: 'text-3xl font-semibold',
      padding: 'px-4 py-3',
      rounded: 'rounded-2xl',
      shadow: 'shadow-lg'
    },
    subtitle: {
      text: 'text-base',
      padding: 'px-4 py-2.5',
      rounded: 'rounded-xl',
      shadow: 'shadow-md'
    },
    text: {
      text: 'text-sm',
      padding: 'px-3 py-2',
      rounded: 'rounded-lg',
      shadow: 'shadow-sm'
    },
    small: {
      text: 'text-xs',
      padding: 'px-2 py-1.5',
      rounded: 'rounded-md',
      shadow: 'shadow-sm'
    }
  }

  const styles = variantStyles[variant]
  const isEmpty = !value || value.trim() === ''

  // Editing state
  if (isEditing) {
    const InputComponent = type === 'textarea' ? 'textarea' : 'input'
    
    return (
      <div className={`relative ${className}`}>
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={type === 'textarea' ? rows : undefined}
          type={type === 'textarea' ? undefined : type}
          className={`
            ${styles.text} ${styles.padding} ${styles.rounded}
            w-full text-gray-900
            border-2 border-emerald-400 focus:border-emerald-500
            focus:outline-none bg-white ${styles.shadow}
            transition-all
            ${type === 'textarea' ? 'resize-none' : ''}
          `}
        />
        <span className="absolute -top-2 left-3 px-2 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-500 rounded-full">
          {editingHint}
        </span>
      </div>
    )
  }

  // Display state
  const DisplayComponent = variant === 'title' ? 'h1' : variant === 'subtitle' ? 'h2' : 'p'
  
  return (
    <div className={`relative group ${className}`}>
      <DisplayComponent
        onClick={handleClick}
        className={`
          ${styles.text} ${styles.padding} ${styles.rounded}
          text-gray-900 cursor-pointer
          hover:text-emerald-600 hover:bg-emerald-50/50
          transition-all
          ${isEmpty && showEmptyState ? 'text-gray-400 italic border-2 border-dashed border-gray-200 hover:border-gray-300' : ''}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
        title={disabled ? '' : hoverHint}
      >
        {isEmpty ? placeholder : value}
      </DisplayComponent>
      {!disabled && (
        <span className="absolute -top-2 left-3 px-2 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {isEmpty && showEmptyState ? 'Click to add' : hoverHint}
        </span>
      )}
    </div>
  )
}

/**
 * InlineEditMultiline Component
 * 
 * Specialized version for multi-line text editing (descriptions, notes, etc.)
 */
export function InlineEditMultiline(props: Omit<InlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="textarea" />
}

/**
 * InlineEditNumber Component
 * 
 * Specialized version for number editing (prices, ratings, etc.)
 */
export function InlineEditNumber(props: Omit<InlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="number" />
}

