-- Add admin_contact table for managing admin contact number
CREATE TABLE public.admin_contact (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_number TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_contact ENABLE ROW LEVEL SECURITY;

-- Everyone can read the contact
CREATE POLICY "Anyone can view admin contact"
ON public.admin_contact
FOR SELECT
USING (true);

-- Only admins can update contact
CREATE POLICY "Admins can update contact"
ON public.admin_contact
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert contact
CREATE POLICY "Admins can insert contact"
ON public.admin_contact
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default contact
INSERT INTO public.admin_contact (whatsapp_number) VALUES ('8446690597');

-- Add trigger for updated_at
CREATE TRIGGER update_admin_contact_updated_at
BEFORE UPDATE ON public.admin_contact
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for admin_contact
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_contact;

-- Enable realtime for user_credentials (for real-time deactivation/deletion)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credentials;