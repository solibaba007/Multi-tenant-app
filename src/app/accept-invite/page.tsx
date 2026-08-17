import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface AcceptInviteProps {
  searchParams: Promise<{ token?: string }> 
}

export default async function AcceptInvitePage({ searchParams }: AcceptInviteProps) {
  const { token } = await searchParams
  const supabase = await createClient()

  if (!token) {
    redirect('/login?error=Invalid or token invitation not found')
  }

  const { data: invite } = await supabase 
    .from('invitations')
    .select('id, tenant_id, email, role, tenants(slug), accepted_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    redirect('/login?error=Invalid or Invitation link not found')
  }

  if (invite.accepted_at) {
    redirect('/login?error=The invitation link has been used')
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    redirect('/login?error=The invitation link has expired')
  }

  const tenant = Array.isArray(invite.tenants) ? invite.tenants[0] : invite.tenants

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    const nextPath = encodeURIComponent(`/accept-invite?token=${token}`)
    redirect(`/login?inviteToken=${token}&email=${encodeURIComponent(invite.email)}&next=${nextPath}`)
  }

  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    redirect(`/login?error=${encodeURIComponent(`This invite was sent to ${invite.email}. You are logged in as ${user.email}.`)}`)
  }
  
  const { error: memberError } = await supabase.from('memberships').upsert({
    tenant_id: invite.tenant_id,
    user_id: user.id,
    role: invite.role || 'member',
  },
  { onConflict: 'tenant_id, user_id' }
  )

  if (memberError) {
    redirect(`/login?error=${encodeURIComponent(memberError.message)}`)
  }

  await supabase.from('invitations').delete().eq('id', invite.id)

  if (tenant?.slug) {
    redirect(`/org/${tenant.slug}/dashboard?success=invite-accepted`)
  }

  redirect('/dashboard')
}