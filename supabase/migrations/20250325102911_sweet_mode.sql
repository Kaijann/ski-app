/*
  # Create Matches Table

  1. New Tables
    - `matches`
      - `id` (uuid, primary key)
      - `user1_id` (uuid, references profiles)
      - `user2_id` (uuid, references profiles)
      - `user1_liked` (boolean)
      - `user2_liked` (boolean)
      - `matched_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `matches` table
    - Add policies for:
      - Users can read their own matches
      - Users can create matches involving themselves
      - Users can update matches involving themselves
*/

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user1_liked boolean,
  user2_liked boolean,
  matched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_are_different CHECK (user1_id != user2_id)
);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

CREATE POLICY "Users can create matches involving themselves"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

CREATE POLICY "Users can update own matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Create index for faster matching queries
CREATE INDEX matches_users_idx ON matches(user1_id, user2_id);
