-- migration: add description column to bucket_items
ALTER TABLE public.bucket_items ADD COLUMN description text;
