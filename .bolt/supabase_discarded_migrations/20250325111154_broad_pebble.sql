/*
  # Add Support for Multiple Photos

  1. Changes
    - Add photo_urls array column to store multiple photo URLs
    - Update constraints and indexes for multiple photos
    - Maintain backward compatibility with existing photo_url column

  2. Security
    - Maintain existing RLS policies
*/

-- Add column for multiple photos
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT ARRAY[]::text[];

-- Create an index for faster photo queries
CREATE INDEX IF NOT EXISTS profiles_photos_idx ON profiles USING GIN(photo_urls);

-- Add a check constraint to ensure photo URLs are valid
ALTER TABLE profiles
  ADD CONSTRAINT valid_photo_urls
  CHECK (
    array_length(photo_urls, 1) <= 6 AND -- Maximum 6 photos
    (SELECT bool_and(
      url ~ '^https?://[^\s/$.?#].[^\s]*$' -- Basic URL format validation
    ) FROM unnest(photo_urls) AS url)
  );

-- Create a trigger to keep photo_url synchronized with the first photo in photo_urls
CREATE OR REPLACE FUNCTION sync_main_photo() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.photo_urls IS NOT NULL AND array_length(NEW.photo_urls, 1) > 0 THEN
    NEW.photo_url := NEW.photo_urls[1];
  ELSE
    NEW.photo_url := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_main_photo_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_main_photo();
