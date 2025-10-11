// Fix for React 19 popover type incompatibility
// This removes the 'hint' value from popover attribute which is not yet supported in TypeScript
declare module 'react' {
  interface HTMLAttributes<T> {
    popover?: '' | 'auto' | 'manual' | undefined
  }
  
  interface ButtonHTMLAttributes<T> {
    popover?: '' | 'auto' | 'manual' | undefined
  }
  
  interface InputHTMLAttributes<T> {
    popover?: '' | 'auto' | 'manual' | undefined
  }
}

export {}

