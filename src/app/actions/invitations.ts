'use server'

import { createClient } from '@/utils/supabase/server' // Adjust to your Supabase client path
import { redirect } from 'next/navigation'

export async function acceptInvitation(token: string) {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    // If not logged in, send them to signup/login with the token as a redirect parameter
    redirect(`/login?next=/invite/${token}`)
  }

  // 2. Fetch the invitation details
  const { data: invite, error: inviteError } = await supabase
    .from('invitations')
    .select('*, tenants(slug, name)')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return { error: 'Invalid invitation link.' }
  }

  // 3. Acceptance Test #5 Checks: Expired or Already Used[cite: 1]
  if (invite.accepted_at) {
    return { error: 'This invitation has already been used.' }
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invitation link has expired.' }
  }

  // Optional: Strict email check (prevents User A from accepting an invite sent to User B)
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { error: `This invite was sent to ${invite.email}. You are logged in as ${user.email}.` }
  }

  // 4. Insert into memberships
  const { error: memberError } = await supabase
    .from('memberships')
    .insert({
      tenant_id: invite.tenant_id,
      user_id: user.id,
      role: invite.role,
    })

  if (memberError) {
    if (memberError.code === '23505') { // Postgres unique violation code
      return { error: 'You are already a member of this workspace.' }
    }
    return { error: 'Failed to join the organization.' }
  }

  // 5. Mark token as accepted
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  // 6. Redirect into the workspace
  // @ts-ignore - Supabase TS inference sometimes misses joined tables
  const tenantSlug = invite.tenants.slug
  redirect(`/${tenantSlug}/dashboard`)
}