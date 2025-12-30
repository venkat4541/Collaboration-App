-- 1. Create a function to check if a user is a member of a dashboard (recursion-proof)
CREATE OR REPLACE FUNCTION public.is_dashboard_member(dash_id UUID, u_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.dashboards WHERE id = dash_id AND owner_id = u_id
    UNION
    SELECT 1 FROM public.dashboard_members WHERE dashboard_id = dash_id AND user_id = u_id
  );
END; $$;

-- 2. Update dashboard_members SELECT policy
DROP POLICY IF EXISTS "Users can view own memberships" ON public.dashboard_members;
DROP POLICY IF EXISTS "Users can view members of dashboards they belong to" ON public.dashboard_members;

CREATE POLICY "Users can view members of their dashboards"
  ON public.dashboard_members FOR SELECT
  USING (public.is_dashboard_member(dashboard_id, auth.uid()));
