-- 1. Create helper functions to break RLS recursion
-- SECURITY DEFINER functions bypass RLS for the tables they query

CREATE OR REPLACE FUNCTION public.has_pending_invite(dash_id UUID, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM dashboard_invites
    WHERE dashboard_id = dash_id
    AND email = user_email
    AND status = 'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_owner(dash_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM dashboards
    WHERE id = dash_id
    AND owner_id = u_id
  );
END;
$$;

-- 2. Update dashboard_invites policies
DROP POLICY IF EXISTS "Dashboard owners can manage invites" ON public.dashboard_invites;
CREATE POLICY "Dashboard owners can manage invites" ON public.dashboard_invites
  FOR ALL USING (public.check_is_owner(dashboard_id, auth.uid()));

-- 3. Update dashboards policies
DROP POLICY IF EXISTS "Invited users can view dashboard metadata" ON public.dashboards;
CREATE POLICY "Invited users can view dashboard metadata" ON public.dashboards
  FOR SELECT
  USING (
    public.has_pending_invite(id, (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- 4. Update dashboard_members policies (just in case)
DROP POLICY IF EXISTS "Owners can remove members" ON public.dashboard_members;
CREATE POLICY "Owners can remove members"
  ON public.dashboard_members FOR DELETE
  USING (public.check_is_owner(dashboard_id, auth.uid()));
