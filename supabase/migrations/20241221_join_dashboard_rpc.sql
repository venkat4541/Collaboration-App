-- Function to look up dashboard by invite code safely
-- This is needed because RLS prevents non-members from seeing dashboards
CREATE OR REPLACE FUNCTION public.get_dashboard_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  owner_id UUID,
  invite_code TEXT,
  one_time_password TEXT,
  max_users INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.*,
    (SELECT COUNT(*)::BIGINT FROM public.dashboard_members m WHERE m.dashboard_id = d.id) as member_count
  FROM public.dashboards d
  WHERE d.invite_code = code;
END;
$$;
