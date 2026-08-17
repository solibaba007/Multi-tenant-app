'use client'

import { useFormStatus } from 'react-dom'

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const { pending } = useFormStatus()

  const defaultStyles =
    'text-xs text-red-600 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button
      type="submit"
      disabled={pending}
      className={className || defaultStyles}
    >
      {pending ? 'Signing out...' : children || 'Sign Out'}
    </button>
  )
}