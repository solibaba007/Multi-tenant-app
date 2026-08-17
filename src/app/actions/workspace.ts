'use server'

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { z } from 'zod'

// 1. Refined Validation Schema
const workSystem = z.object({
  name: z.string().trim().min(2, 'Name must contain at least two letters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least two characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
})

export type AuthStateUser = {
  error?: string
} | null

export async function CheckWorkUser(
  _preServe: AuthStateUser,
  formData: FormData
): Promise<AuthStateUser> { // 👈 FIXED: Promise type capitalization
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: AuthUser,
  } = await supabase.auth.getUser()

  if (AuthUser || !user) {
    return { error: 'No authentication, try logging in again' }
  }

  // 2. Validate input fields
  const validation = workSystem.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Invalid user input' }
  }

  const { name, slug } = validation.data

  // 3. Create workspace (Tenant)
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name, slug })
    .select('id, slug') // 👈 FIXED: Must select 'id' so tenant.id exists below
    .single()

  if (tenantError) {
    if (tenantError.code === '23505') {
      return { error: 'The workspace slug has already been taken by someone else' }
    }
    return { error: tenantError.message }
  }

  // 4. Assign current user as Owner
  const { error: membershipError } = await supabase.from('memberships').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: 'owner',
  })

  // 5. Cleanup on failure
  if (membershipError) {
    // 👈 FIXED: Must delete using tenant.id, not user.id
    await supabase.from('tenants').delete().eq('id', tenant.id) 
    return { error: 'Failed to set workspace owner. Please try again.' }
  }

  // 6. Redirect to new tenant space
  redirect(`/${tenant.slug}`)
}