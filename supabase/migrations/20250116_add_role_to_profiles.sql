-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for faster role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update your user to admin (replace with your actual user ID)
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

