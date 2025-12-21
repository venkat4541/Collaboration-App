-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create dashboards table
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  one_time_password TEXT NOT NULL,
  max_users INTEGER DEFAULT 4 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create dashboard_members table
CREATE TABLE IF NOT EXISTS public.dashboard_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(dashboard_id, user_id)
);

-- Create widgets table
CREATE TABLE IF NOT EXISTS public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create timer_sessions table
CREATE TABLE IF NOT EXISTS public.timer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES public.widgets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_seconds INTEGER DEFAULT 0 NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(widget_id, user_id, date)
);

-- Create timer_states table (for real-time sync)
CREATE TABLE IF NOT EXISTS public.timer_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES public.widgets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('idle', 'running', 'paused')) DEFAULT 'idle' NOT NULL,
  current_seconds INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(widget_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dashboards_owner_id ON public.dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_members_dashboard_id ON public.dashboard_members(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_members_user_id ON public.dashboard_members(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id ON public.widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_widget_id ON public.timer_sessions(widget_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON public.timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_date ON public.timer_sessions(date);
CREATE INDEX IF NOT EXISTS idx_timer_states_widget_id ON public.timer_states(widget_id);
CREATE INDEX IF NOT EXISTS idx_timer_states_user_id ON public.timer_states(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_dashboard_id ON public.chat_messages(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for dashboards
CREATE POLICY "Users can view dashboards they own or are members of"
  ON public.dashboards FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT dashboard_id FROM public.dashboard_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create dashboards"
  ON public.dashboards FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Only owners can update their dashboards"
  ON public.dashboards FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Only owners can delete their dashboards"
  ON public.dashboards FOR DELETE
  USING (owner_id = auth.uid());

-- RLS Policies for dashboard_members
CREATE POLICY "Users can view members of dashboards they belong to"
  ON public.dashboard_members FOR SELECT
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
      UNION
      SELECT dashboard_id FROM public.dashboard_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join dashboards"
  ON public.dashboard_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can remove members"
  ON public.dashboard_members FOR DELETE
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for widgets
CREATE POLICY "Users can view widgets of dashboards they belong to"
  ON public.widgets FOR SELECT
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
      UNION
      SELECT dashboard_id FROM public.dashboard_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Dashboard owners can manage widgets"
  ON public.widgets FOR ALL
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for timer_sessions
CREATE POLICY "Users can view timer sessions of dashboards they belong to"
  ON public.timer_sessions FOR SELECT
  USING (
    widget_id IN (
      SELECT id FROM public.widgets WHERE dashboard_id IN (
        SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
        UNION
        SELECT dashboard_id FROM public.dashboard_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own timer sessions"
  ON public.timer_sessions FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for timer_states
CREATE POLICY "Users can view timer states of dashboards they belong to"
  ON public.timer_states FOR SELECT
  USING (
    widget_id IN (
      SELECT id FROM public.widgets WHERE dashboard_id IN (
        SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
        UNION
        SELECT dashboard_id FROM public.dashboard_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own timer states"
  ON public.timer_states FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view chat messages of dashboards they belong to"
  ON public.chat_messages FOR SELECT
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
      UNION
      SELECT dashboard_id FROM public.dashboard_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send chat messages to dashboards they belong to"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    dashboard_id IN (
      SELECT id FROM public.dashboards WHERE owner_id = auth.uid()
      UNION
      SELECT dashboard_id FROM public.dashboard_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can soft delete their own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (user_id = auth.uid());

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_dashboards
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_timer_sessions
  BEFORE UPDATE ON public.timer_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
