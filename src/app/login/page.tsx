import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { login, signup } from '@/app/action/auth'
import { SubmitButton } from '@/components/SubmitButton'

interface LoginPageProps {
  searchParams: Promise<{
    success?: string
    next?: string
    error?: string
    mode?: string
    inviteToken?: string
    email?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { success, next, error, mode = 'login', inviteToken, email: initialEmail } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(next || '/select-tenant')
  }

  const isInviteMode = Boolean(inviteToken)
  const isSignUp = mode === 'signup'

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 mx-auto">
        <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xl">
          
          {/* Lock Icon header for Invitation Mode */}
          {isInviteMode && (
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Tab Navigation: Standard Mode Only */}
          {!isInviteMode && (
            <div className="flex border-b border-gray-100">
              <Link
                href={`/login?mode=login${next ? `&next=${encodeURIComponent(next)}` : ''}`}
                className={`flex-1 text-center text-sm font-bold pb-3 transition ${
                  !isSignUp
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Sign In
              </Link>
              <Link
                href={`/login?mode=signup${next ? `&next=${encodeURIComponent(next)}` : ''}`}
                className={`flex-1 text-center text-sm font-bold pb-3 transition ${
                  isSignUp
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Header Text */}
          <div className={isInviteMode ? 'text-center' : ''}>
            <h2 className="text-2xl font-bold text-gray-900">
              {isInviteMode
                ? 'Sign in to accept invite'
                : isSignUp
                ? 'Create an Account'
                : 'Welcome Back'}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {isInviteMode
                ? 'Please sign in or create an account to proceed with your workspace invitation.'
                : isSignUp
                ? 'Enter your credentials below to create your new account.'
                : 'Sign in to manage your workspaces and projects.'}
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {success === 'invite-accepted' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium">
              Invitation accepted! Please sign in to continue.
            </div>
          )}

          {/* Form */}
          <form action={isSignUp && !isInviteMode ? signup : login} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                defaultValue={initialEmail || ''}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Action Buttons */}
            {isInviteMode ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <SubmitButton className="w-full">
                  Sign In
                </SubmitButton>
                <Link
                  href={`/login?mode=signup&inviteToken=${inviteToken}&email=${encodeURIComponent(
                    initialEmail || ''
                  )}&next=${encodeURIComponent(next || '')}`}
                  className="w-full text-center cursor-pointer rounded-xl bg-gray-100 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 flex items-center justify-center"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <SubmitButton className="w-full">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </SubmitButton>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}