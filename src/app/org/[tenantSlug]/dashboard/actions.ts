'use server'

import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function createInvitation({
  tenantId,
  email,
  role,
}: {
  tenantId: string
  email: string
  role: string
}) {
  const supabase = await createClient()

  // 1. Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  // 2. Verify current user's membership & authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // 3. Generate token & set 7-day expiry
  const token = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('invitations').insert({
    tenant_id: tenantId,
    email: email.toLowerCase().trim(),
    role,
    token,
    invited_by: user.id,
    expires_at: expiresAt,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: `An active invitation has already been sent to ${email}.` }
    }
    return { error: error.message }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`

  return { inviteUrl, successEmail: email }
}