'use client'

import { useState, useTransition } from 'react'
import { createInvitation } from '@/app/org/[tenantSlug]/dashboard/actions'

interface InviteModalProps {
  tenantId: string
  tenantSlug: string
}

export default function InviteModal({ tenantId }: InviteModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    setIsOpen(false)
    setEmail('')
    setError(null)
    setInviteUrl(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInviteUrl(null)

    startTransition(async () => {
      const res = await createInvitation({ tenantId, email, role })

      if (res?.error) {
        setError(res.error)
      } else if (res?.inviteUrl) {
        setInviteUrl(res.inviteUrl)
        setEmail('')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        + Invite Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Invite Team Member</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="colleague@company.com"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="invite-role" className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              {inviteUrl && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                  <p className="font-semibold">Invitation Created!</p>
                  <p className="mt-1 break-all select-all font-mono">{inviteUrl}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? 'Generating...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}