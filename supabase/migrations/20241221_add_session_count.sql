-- Add session_count column to timer_sessions table
ALTER TABLE public.timer_sessions 
ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 1 NOT NULL;
