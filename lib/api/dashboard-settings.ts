// @ts-nocheck
import { createClient } from '@/lib/supabase/client'

export async function updateDashboardName(dashboardId: string, name: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dashboards')
    .update({ name })
    .eq('id', dashboardId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDashboard(dashboardId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', dashboardId)

  if (error) throw error
}
