'use server'

import { createClient } from "@/utils/supabase/server"
import crypto from 'crypto'

export type InviteUserState = {
  error?: string 
  success?: boolean 
  message?: string 
  inviteUrl?: string
} | null 

export async function SendInviteUser(_preServe: InviteUserState, formData: FormData): Promise<InviteUserState> {
  const supabase = await createClient()

  const email = formData.get('email')?.toString().toLowerCase().trim()
  const role = formData.get('role')?.toString() || 'member'
  const tenantSlug = formData.get('tenantSlug')?.toString()

  if (!email || !tenantSlug) {
    return { error: 'Invalid or missing email and tenantSlug.' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You have to sign in to be able to send invitations.' }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', tenantSlug)
    .single()

  if (tenantError || !tenant) {
    return { error: 'Workspace not found.' }
  }

  const token = crypto.randomUUID()
  const expireAT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: inviteError } = await supabase.from('invitations').insert({
    tenant_id: tenant.id,
    invited_by: user.id,
    role: role,
    expires_at: expireAT,
    email: email,
    token: token,
  })

  if (inviteError) {
    return { error: `Database error: ${inviteError.message}` }
  }

  // FIXED: Changed localhost:300 to localhost:3000
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrlObj = new URL('/accept-invite', origin)
  inviteUrlObj.searchParams.set('token', token)

  const inviteUrl = inviteUrlObj.toString()

  return {
    success: true,
    message: `Invitation granted for ${email}`,
    inviteUrl,
  }
}