-- RLS Policies for secure access
-- This migration sets up Row Level Security policies

-- Memos table policies
CREATE POLICY "Users can view own memos" 
ON public.memos FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own memos" 
ON public.memos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own memos" 
ON public.memos FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own memos" 
ON public.memos FOR DELETE 
TO authenticated 
USING (auth.uid()::text = user_id);

-- API Keys table policies
CREATE POLICY "Users can view own API keys" 
ON public.api_keys FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own API keys" 
ON public.api_keys FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own API keys" 
ON public.api_keys FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own API keys" 
ON public.api_keys FOR DELETE 
TO authenticated 
USING (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.memos TO authenticated;
GRANT ALL ON public.api_keys TO authenticated;
GRANT SELECT ON public.memos_view TO authenticated;
GRANT SELECT ON public.api_keys_view TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 