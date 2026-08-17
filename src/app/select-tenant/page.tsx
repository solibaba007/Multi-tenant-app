import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '@/app/action/auth'
import { SignOutButton } from '@/components/SignOutButton'
import CreateWorkSpaceForm from './CreateWorkSpaceForm'

interface SelectTenantPageProps {
  searchParams: Promise<{ create?: string }>
}

export default async function SelectTenantPage({ searchParams }: SelectTenantPageProps) {
  const { create } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/select-tenant')
  }

  const { data: memberships } = await supabase
    .from('memberships')
    .select('role, tenants(id, name, slug)')
    .eq('user_id', user.id)

  const hasWorkspaces = memberships && memberships.length > 0
  const isCreatingNew = create === 'true' || !hasWorkspaces

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isCreatingNew ? 'Setup Workspace' : 'Select Workspace'}
            </h1>
            <p className="mt-1 text-xs text-gray-500">{user.email}</p>
          </div>
          <form action={signout}>
            <SignOutButton className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700">
              Sign Out
            </SignOutButton>
          </form>
        </div>

        {!isCreatingNew ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {memberships.map((item) => {
                const tenant = Array.isArray(item.tenants) ? item.tenants[0] : item.tenants
                if (!tenant) return null

                return (
                  <Link
                    key={tenant.id}
                    href={`/org/${tenant.slug}/dashboard`}
                    className="group flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-blue-500 hover:bg-blue-50/50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{item.role}</p>
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-blue-600">→</span>
                  </Link>
                )
              })}
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/select-tenant?create=true"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                + Create another workspace
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <CreateWorkSpaceForm />
            {hasWorkspaces && (
              <div className="mt-4 text-center border-t border-gray-100 pt-3">
                <Link
                  href="/select-tenant"
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  ← Back to my workspaces
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}