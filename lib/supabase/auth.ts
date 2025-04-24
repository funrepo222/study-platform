import { createClient } from './client'
import { Database } from '@/types/supabase'

export type UserWithProfile = {
  id: string
  email: string
  name: string
  surname: string
  username: string
  role: 'student' | 'teacher' | 'admin'
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  surname: string,
  username: string,
  role: 'student' | 'teacher'
) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          surname,
          username,
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error

    // Create profile record in users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name,
          surname,
          username,
          email,
          role,
        })

      if (profileError) throw profileError
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { data: null, error }
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Get user profile after successful sign in
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return { data: { ...data, profile }, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { data: null, error }
  }
}

export async function signOut() {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error }
  }
}

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) return null
    
    // Get user profile from the users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError || !profile) return null
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: profile.name,
      surname: profile.surname,
      username: profile.username,
      role: profile.role,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function generateUsername(name: string, surname: string): Promise<string> {
  const supabase = createClient()
  const baseUsername = `${name.toLowerCase().replace(/\s+/g, '')}.${surname.toLowerCase().replace(/\s+/g, '')}`
  
  // Check if username exists
  const { data } = await supabase
    .from('users')
    .select('username')
    .eq('username', baseUsername)
  
  if (!data || data.length === 0) {
    return baseUsername
  }
  
  // If username exists, add a random number
  const randomSuffix = Math.floor(Math.random() * 1000)
  return `${baseUsername}${randomSuffix}`
}