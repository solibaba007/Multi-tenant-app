'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim().toLowerCase()

  if (!name || !slug) {
    return { error: 'Organization name and URL slug are required.' }
  }

  // 1. Check user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expired. Please log in again.' }
  }

  // 2. Slug availability check
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingTenant) {
    return { error: `The URL slug "${slug}" is already taken.` }
  }

  // 3. Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name, slug })
    .select('id, slug')
    .single()

  if (tenantError) {
    if (tenantError.code === '23505') {
      return { error: `The URL slug "${slug}" is already taken.` }
    }
    return { error: tenantError.message }
  }

  // 4. Assign user membership as Owner
  const { error: memberError } = await supabase.from('memberships').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    return { error: memberError.message }
  }

  revalidatePath('/', 'layout')

  return { redirectTo: `/org/${tenant.slug}/dashboard?created=true` }
}