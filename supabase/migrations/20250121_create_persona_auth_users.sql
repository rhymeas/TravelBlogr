-- Create persona users in auth.users table
-- These are the team personas that write blog posts

-- Emma Chen - The Adventure Seeker
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'emma.chen@travelblogr.com',
  crypt('persona-password-emma', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Emma Chen","avatar_url":"https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Sofia Martinez - The Family Travel Expert
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'sofia.martinez@travelblogr.com',
  crypt('persona-password-sofia', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sofia Martinez","avatar_url":"https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Yuki Tanaka - The Cultural Explorer
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'yuki.tanaka@travelblogr.com',
  crypt('persona-password-yuki', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Yuki Tanaka","avatar_url":"https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Marcus Okonkwo - The Budget Backpacker
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'marcus.okonkwo@travelblogr.com',
  crypt('persona-password-marcus', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Marcus Okonkwo","avatar_url":"https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Alex Thompson - The Digital Nomad
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'alex.thompson@travelblogr.com',
  crypt('persona-password-alex', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alex Thompson","avatar_url":"https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Update profiles to match (in case they don't exist yet)
-- The trigger should have created them, but let's ensure they're correct

UPDATE public.profiles SET
  full_name = 'Emma Chen',
  username = 'emma_chen',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  bio = 'Adventure enthusiast and outdoor lover. Always seeking the next adrenaline rush! 🏔️',
  role = 'admin'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET
  full_name = 'Sofia Martinez',
  username = 'sofia_martinez',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
  bio = 'Family travel expert and mom of three. Making travel accessible and fun for families! 👨‍👩‍👧‍👦',
  role = 'admin'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
  full_name = 'Yuki Tanaka',
  username = 'yuki_tanaka',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
  bio = 'Photographer and cultural storyteller. Finding beauty in the everyday moments of travel. 📸',
  role = 'admin'
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET
  full_name = 'Marcus Okonkwo',
  username = 'marcus_okonkwo',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
  bio = 'Budget backpacker and hostel enthusiast. Proving you don''t need money to see the world! 🎒',
  role = 'admin'
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE public.profiles SET
  full_name = 'Alex Thompson',
  username = 'alex_thompson',
  avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  bio = 'Digital nomad and remote work enthusiast. Working from anywhere, living everywhere. 💻🌍',
  role = 'admin'
WHERE id = '55555555-5555-5555-5555-555555555555';

