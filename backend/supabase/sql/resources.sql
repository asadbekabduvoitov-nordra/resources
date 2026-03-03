-- Supabase Schema for Oliy Maqsad Resources Bot
-- Run this in your Supabase SQL Editor

-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    media_type TEXT NOT NULL DEFAULT 'none' CHECK (media_type IN ('image', 'video', 'file', 'none')),
    media_url TEXT,
    telegram_file_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON public.resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're using service role key)
CREATE POLICY "Allow all operations" ON public.resources
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to storage bucket
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'resources');

CREATE POLICY "Authenticated users can update" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can delete" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'resources');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
