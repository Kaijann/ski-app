/*
  # Initial Schema Setup for SkiBuddy App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text)
      - `location` (text)
      - `years_skiing` (integer)
      - `preferred_terrain` (text array)
      - `skill_level` (text)
      - `speed_preference` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for:
      - Users can read all profiles
      - Users can only update their own profile
      - Users can only insert their own profile
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  location text NOT NULL,
  years_skiing integer NOT NULL,
  preferred_terrain text[] NOT NULL,
  skill_level text NOT NULL,
  speed_preference text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_skill_level CHECK (skill_level IN ('green', 'blue', 'black', 'double black')),
  CONSTRAINT valid_speed_preference CHECK (speed_preference IN ('relaxed', 'moderate', 'fast'))
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
