'use server'

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string || ""
  const password = formData.get('password') as string || ""
  const next = formData.get('next') as string || ""

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`)
  }

  redirect(next || '/select-tenant')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string || ""
  const password = formData.get('password') as string || ""
  const next = formData.get('next') as string || ""

  // ✅ Fixed: Changed signUp to signInWithPassword
  const { error } = await supabase.auth.signInWithPassword({ email, password }) 

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(next || '/select-tenant')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // ✅ Fixed: Redirect to /login instead of /logout
  redirect('/login')
}