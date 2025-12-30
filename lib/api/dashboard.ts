import { createClient } from '@/lib/supabase/client'
import { generateInviteCode, generateOTP } from '@/lib/utils'

export async function createDashboard(name: string, userId: string) {
  const supabase = createClient()
  
  const inviteCode = generateInviteCode()
  const otp = generateOTP()

  // Create dashboard
  const { data: dashboard, error: dashboardError } = await supabase
    .from('dashboards')
    .insert({
      name,
      owner_id: userId,
      invite_code: inviteCode,
      one_time_password: otp,
      max_users: 4,
    })
    .select()
    .single()

  if (dashboardError || !dashboard) throw dashboardError || new Error('Failed to create dashboard')

  // Add owner as member
  const { error: memberError } = await supabase
    .from('dashboard_members')
    .insert({
      dashboard_id: dashboard.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) throw memberError

  // Create default widgets
  const defaultWidgets = [
    { title: 'System Design', position: 0 },
    { title: 'Leetcode', position: 1 },
    { title: 'Behavioral', position: 2 },
    { title: 'Job Applications', position: 3 },
  ]

  const { error: widgetsError } = await supabase
    .from('widgets')
    .insert(
      defaultWidgets.map((widget) => ({
        dashboard_id: dashboard.id,
        title: widget.title,
        position: widget.position,
        is_default: true,
      }))
    )

  if (widgetsError) throw widgetsError

  return { dashboard, inviteCode, otp }
}

export async function getUserDashboards(userId: string) {
  const supabase = createClient()

  // First, get the user's dashboard memberships
  const { data: memberships, error: memberError } = await supabase
    .from('dashboard_members')
    .select('dashboard_id, role')
    .eq('user_id', userId)

  if (memberError) throw memberError
  if (!memberships || memberships.length === 0) return []

  const dashboardIds = memberships.map(m => m.dashboard_id)

  // Then get the dashboard details
  const { data: dashboards, error: dashError } = await supabase
    .from('dashboards')
    .select('*')
    .in('id', dashboardIds)

  if (dashError) throw dashError

  // Get all members for these dashboards (including profiles)
  // Add timestamp to force fresh data
  const { data: allMembers, error: allMembersError } = await supabase
    .from('dashboard_members')
    .select(`
      dashboard_id,
      user_id,
      role,
      profiles (
        display_name,
        email,
        avatar_url
      )
    `)
    .in('dashboard_id', dashboardIds)

  if (allMembersError) throw allMembersError

  // Combine the data client-side
  return memberships.map(membership => {
    const dashboard = dashboards?.find(d => d.id === membership.dashboard_id)
    const members = allMembers?.filter(m => m.dashboard_id === membership.dashboard_id) || []
    
    return {
      ...membership,
      dashboards: {
        ...dashboard,
        dashboard_members: members
      }
    }
  })
}

export async function removeMember(dashboardId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('dashboard_members')
    .delete()
    .eq('dashboard_id', dashboardId)
    .eq('user_id', userId)

  if (error) throw error
}

// Local interface for dashboard RPC response
interface DashboardRpcResponse {
  id: string
  name: string
  owner_id: string
  invite_code: string
  one_time_password: string
  max_users: number
  created_at: string
  updated_at: string
  member_count: number
}

export async function joinDashboard(inviteCode: string, otp: string, userId: string) {
  const supabase = createClient()

  // Find dashboard by invite code using RPC (to bypass RLS)
  const { data, error: dashboardError } = await supabase
    // @ts-expect-error - RPC function not yet in types
    .rpc('get_dashboard_by_invite_code', { code: inviteCode })
    .single()

  const dashboard = data as unknown as DashboardRpcResponse

  if (dashboardError || !dashboard) throw new Error('Invalid invite code')

  // Verify OTP
  if (dashboard.one_time_password !== otp) {
    throw new Error('Invalid one-time password')
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('dashboard_members')
    .select()
    .eq('dashboard_id', dashboard.id)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    throw new Error('You are already a member of this dashboard')
  }

  // Check member count
  const { count } = await supabase
    .from('dashboard_members')
    .select('*', { count: 'exact', head: true })
    .eq('dashboard_id', dashboard.id)

  if (count && count >= dashboard.max_users) {
    throw new Error('Dashboard is full (maximum 4 members)')
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from('dashboard_members')
    .insert({
      dashboard_id: dashboard.id,
      user_id: userId,
      role: 'member',
    })

  if (memberError) throw memberError

  return dashboard
}

export async function updateDashboardName(dashboardId: string, name: string, userId: string) {
  const supabase = createClient()

  // Verify user is owner
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select()
    .eq('id', dashboardId)
    .eq('owner_id', userId)
    .single()

  if (!dashboard) {
    throw new Error('Only the owner can update the dashboard name')
  }

  const { error } = await supabase
    .from('dashboards')
    .update({ name })
    .eq('id', dashboardId)

  if (error) throw error
}

export async function deleteDashboard(dashboardId: string, userId: string) {
  const supabase = createClient()

  // Verify user is owner
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select()
    .eq('id', dashboardId)
    .eq('owner_id', userId)
    .single()

  if (!dashboard) {
    throw new Error('Only the owner can delete the dashboard')
  }

  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', dashboardId)

  if (error) throw error
}

export async function getDashboard(dashboardId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboards')
    .select(`
      *,
      dashboard_members (
        user_id,
        role,
        profiles (
          display_name,
          email
        )
      )
    `)
    .eq('id', dashboardId)
    .single()

  if (error) throw error
  return data
}

export async function leaveDashboard(dashboardId: string, userId: string) {
  const supabase = createClient()

  // Verify user is a member but not the owner
  const { data: dashboard } = await supabase
    .from('dashboards')
    .select('owner_id')
    .eq('id', dashboardId)
    .single()

  if (dashboard?.owner_id === userId) {
    throw new Error('Owners cannot leave their own dashboard. Delete it instead.')
  }

  // Remove user from dashboard_members
  const { error } = await supabase
    .from('dashboard_members')
    .delete()
    .eq('dashboard_id', dashboardId)
    .eq('user_id', userId)

  if (error) throw error
}
