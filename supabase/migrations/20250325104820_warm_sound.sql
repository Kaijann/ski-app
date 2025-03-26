/*
  # Add new profile fields

  1. Changes
    - Add birthday column
    - Add gender column
    - Make email optional since it's already in auth.users
    - Add photo_url column

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles 
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add constraint for gender values
ALTER TABLE profiles
  ADD CONSTRAINT valid_gender
  CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]));
