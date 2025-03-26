/*
  # Update Profile Photos Storage

  1. Changes
    - Add photo_storage_path column to profiles table
    - Add constraints and indexes for efficient photo handling
    - Add RLS policies for photo management

  Note: Since the storage extension is not available, we'll store photo URLs
  and handle file storage at the application level.
*/

-- Add photo storage related columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photo_storage_path text,
  ADD COLUMN IF NOT EXISTS photo_updated_at timestamptz DEFAULT now();

-- Create an index for faster photo queries
CREATE INDEX IF NOT EXISTS profiles_photo_idx ON profiles(id) WHERE photo_storage_path IS NOT NULL;

-- Add a check constraint to ensure photo paths follow the correct format
ALTER TABLE profiles
  ADD CONSTRAINT valid_photo_path
  CHECK (
    photo_storage_path IS NULL OR
    photo_storage_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+\.(jpg|jpeg|png|gif)$'
  );

-- Update the existing RLS policies to include photo management
CREATE OR REPLACE POLICY "Users can update their own profile photos"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (
      photo_storage_path IS NULL OR
      photo_storage_path ~ ('^' || auth.uid() || '/')
    )
  );
