-- Re-enable RLS on dashboard_members if it was disabled
ALTER TABLE public.dashboard_members ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view members of dashboards they belong to" ON public.dashboard_members;
DROP POLICY IF EXISTS "Owners can view all members" ON public.dashboard_members;
DROP POLICY IF EXISTS "Members can view their own membership" ON public.dashboard_members;
DROP POLICY IF EXISTS "Users can join dashboards" ON public.dashboard_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.dashboard_members;

-- Create simple, non-recursive policies

-- Policy 1: Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.dashboard_members FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users can insert their own memberships (for joining)
CREATE POLICY "Users can join dashboards"
  ON public.dashboard_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Dashboard owners can delete members
CREATE POLICY "Owners can remove members"
  ON public.dashboard_members FOR DELETE
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
    )
  );
