import { createClient } from '@/lib/supabase/client'

// Local type definition since these tables aren't in the generated types yet
export interface DashboardInvite {
  id: string
  dashboard_id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
  dashboards?: {
    name: string
    invite_code: string
    one_time_password: string
  }
}

export async function sendEmailInvite(dashboardId: string, email: string, invitedBy: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboard_invites' as any)
    .insert({
      dashboard_id: dashboardId,
      email: email.toLowerCase().trim(),
      invited_by: invitedBy,
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('An invite for this email already exists for this dashboard')
    }
    throw error
  }
  return data as unknown as DashboardInvite
}

export async function getPendingInvites(dashboardId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboard_invites' as any)
    .select('*')
    .eq('dashboard_id', dashboardId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as DashboardInvite[]
}

export async function cancelInvite(inviteId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('dashboard_invites' as any)
    .delete()
    .eq('id', inviteId)

  if (error) throw error
}

export async function getInvitesForUser(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboard_invites' as any)
    .select(`
      *,
      dashboards (
        name,
        invite_code,
        one_time_password
      )
    `)
    .eq('email', email.toLowerCase().trim())
    .eq('status', 'pending')

  if (error) throw error
  
  // Map one_time_password to otp for consistency if needed, 
  // though the UI should probably use the correct field name.
  // The database schema uses one_time_password.
  return data as unknown as DashboardInvite[]
}
