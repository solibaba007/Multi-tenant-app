'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspace } from './actions'

export default function CreateWorkSpaceForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('slug', slug)

    const res = await createWorkspace(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.redirectTo) {
      router.push(res.redirectTo)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Create Workspace</h2>
        <p className="text-xs text-gray-500">Set up your organization workspace to continue.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-xs font-semibold text-gray-700">
          Organization Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSlug(slugify(e.target.value))
            if (error) setError(null)
          }}
          placeholder="e.g. Acme Corp"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-xs font-semibold text-gray-700">
          URL Slug
        </label>
        <input
          id="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value))
            if (error) setError(null)
          }}
          placeholder="acme-corp"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating Workspace...' : 'Create Workspace & Continue'}
      </button>
    </form>
  )
}