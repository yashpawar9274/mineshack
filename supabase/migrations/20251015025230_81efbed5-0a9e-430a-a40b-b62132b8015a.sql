-- Add expires_at column to user_credentials table
ALTER TABLE public.user_credentials 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on expiration checks
CREATE INDEX idx_user_credentials_expires_at ON public.user_credentials(expires_at);

-- Update admin password to 'Ashking' if admin user exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find admin user by email
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@mines.com';

  -- Update password if user exists
  IF admin_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET encrypted_password = crypt('Ashking', gen_salt('bf'))
    WHERE id = admin_user_id;
    
    -- Ensure admin role exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;