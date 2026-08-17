'use client'

import { useState } from "react"
import { acceptInvitation } from "./actions"

export default function InviteButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)

    try {
      const res = await acceptInvitation(token)

      if (res?.error) {
        setError(res.error)
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected connection error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="w-full cursor-pointer rounded-lg border border-blue-100 bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition duration-200 ease-in-out hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            {/* Spinning circle */}
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {/* Stationary text */}
            <span>Processing...</span>
          </div>
        ) : (
          'Accept Invitation'
        )}
      </button>
    </div>
  )
}