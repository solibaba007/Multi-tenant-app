'use server'

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { z } from 'zod'

const MaxAuthUser = z.object({
  email: z.string().trim().email({ message: 'Input valid email address' }),
  password: z.string().trim().min(6, { message: 'Password must be at least 6 characters' }),
  next: z
    .string()
    .trim()
    .optional() // 👈 FIXED: Prevents Zod from rejecting null/undefined form inputs
    .transform((val) => {
      if (!val || !val.startsWith('/') || val.startsWith('//')) {
        return '/select-tenant'
      }
      return val
    }),
})

// 👈 FIXED: Renamed from 'useAction' to avoid hook naming conflicts
export type ActionState = {
  error?: string
} | null

export async function login(_preserve: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const validation = MaxAuthUser.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Invalid user input' }
  }

  const { email, password, next } = validation.data

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`)
  }

  redirect(next)
}

export async function signup(_preServe: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const validation = MaxAuthUser.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Invalid user input' }
  }

  const { email, password, next } = validation.data

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect(next)
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/login')
}