-- Add theme preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'theme-zinc';
