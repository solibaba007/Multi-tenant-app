import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import InviteMemberForm from './InviteMemberForm'

interface DashboardProps {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ created?: string }>
}

export default async function DashboardPage({ params, searchParams }: DashboardProps) {
  const { tenantSlug } = await params
  const { created } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/org/${tenantSlug}/dashboard`)
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', tenantSlug)
    .maybeSingle()

  if (!tenant) notFound()

  return (
    <div className="flex min-h-screen justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Success Notification Banner */}
        {created === 'true' && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 font-bold text-emerald-800 text-xs">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900">
                Workspace Created Successfully!
              </h3>
              <p className="mt-0.5 text-xs text-emerald-700">
                Your workspace <span className="font-semibold">{tenant.name}</span> is ready. You can now invite members to collaborate.
              </p>
            </div>
          </div>
        )}

        {/* Invite Member Section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <InviteMemberForm tenantId={tenant.id} />
        </div>
      </div>
    </div>
  )
}