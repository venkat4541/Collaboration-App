-- Create a SECURITY DEFINER function to check widget access (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_widget_member(widget_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.widgets w
    JOIN public.dashboard_members dm ON w.dashboard_id = dm.dashboard_id
    WHERE w.id = widget_id_param AND dm.user_id = auth.uid()
  );
$$;

-- Drop and recreate timer_sessions SELECT policy using the function
DROP POLICY IF EXISTS "Users can view timer_sessions in their dashboards" ON public.timer_sessions;
CREATE POLICY "Users can view timer_sessions in their dashboards" ON public.timer_sessions
  FOR SELECT
  USING (public.is_widget_member(widget_id));

-- Ensure own session management policy exists  
DROP POLICY IF EXISTS "Users can manage their own timer_sessions" ON public.timer_sessions;
CREATE POLICY "Users can manage their own timer_sessions" ON public.timer_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
  
DROP POLICY IF EXISTS "Users can update their own timer_sessions" ON public.timer_sessions;
CREATE POLICY "Users can update their own timer_sessions" ON public.timer_sessions
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own timer_sessions" ON public.timer_sessions;
CREATE POLICY "Users can delete their own timer_sessions" ON public.timer_sessions
  FOR DELETE USING (user_id = auth.uid());
